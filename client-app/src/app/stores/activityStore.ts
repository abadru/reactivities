import {action, computed, observable, runInAction} from "mobx";
import {SyntheticEvent} from "react";
import {IActivity} from "../models/activity";
import agent from "../api/agent";
import {history} from "../../index";
import {toast} from "react-toastify";
import {RootStore} from "./rootStore";
import {createAttendee, setActivityProps} from "../common/util/util";
import {HubConnection, HubConnectionBuilder, LogLevel} from "@microsoft/signalr";


export default class ActivityStore {

    rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    @observable activityRegistry = new Map();
    @observable activity: IActivity | null = null;
    @observable loadingInitial = false;
    @observable submitting = false;
    @observable target = '';
    @observable loading = false;

    @observable.ref hubConnection: HubConnection | null = null;

    @action createHubConnection = (activityId: string) => {
        this.hubConnection = new HubConnectionBuilder()
            .withUrl('http://localhost:5000/chat', {
                accessTokenFactory: () => this.rootStore.commonStore.token!
            })
            .configureLogging(LogLevel.Information)
            .build();

        this.hubConnection
            .start()
            .then(() => console.log(this.hubConnection!.state))
            .then(() => {
                console.log('Attempting to join group');
                this.hubConnection!.invoke("AddToGroup", activityId);
            })
            .catch((err) => console.log('Error establishing connection', err));

        this.hubConnection.on('ReceiveComment', comment => {
            runInAction(() => {
                this.activity!.comments.push(comment);
            });
        });

        this.hubConnection.on('Send', message => {
            toast.info(message);
        });

    }

    @action stopHubConnection = () => {
        this.hubConnection!.invoke('RemoveFromGroup', this.activity!.id).then(() => {
            this.hubConnection!.stop();
        })
            .then(() => console.log('The connection has stopped'))
            .catch((e) => console.log(e));
    }

    @action addComment = async (values: any) => {
        values.activityId = this.activity!.id;
        try {

            await this.hubConnection!.invoke("SendComment", values);

        } catch (e) {
            console.log(e);
        }
    }

    @computed get activitiesByDate() {
        return this.groupActivitiesDate(Array.from(this.activityRegistry.values()));
    }

    groupActivitiesDate = (activities: IActivity[]) => {
        const sortedActivities = activities.sort(
            (a, b) => a.date.getTime() - b.date.getTime()
        );

        return Object.entries(sortedActivities.reduce((activities, activity) => {
            const date = activity.date.toISOString().split('T')[0];
            activities[date] = activities[date] ? [...activities[date], activity] : [activity];
            return activities;
        }, {} as { [key: string]: IActivity[] }));
    }


    @action loadActivities = async () => {
        this.loadingInitial = true;
        try {
            const activities = await agent.Activities.list();

            runInAction('Loading Activities', async () => {
                activities.forEach(activity => {
                    setActivityProps(activity, this.rootStore.userStore.user!);
                    this.activityRegistry.set(activity.id, activity);
                });
                this.loadingInitial = false;
            });

        } catch (error) {
            runInAction('Logging activitties error', () => {
                this.loadingInitial = false;
            });
            console.log(error);


        }
    }

    @action loadActivity = async (id: string) => {
        let activity = this.getActivity(id);
        if (activity) {
            this.activity = activity;
            return activity;
        } else {
            this.loadingInitial = true;
            try {
                activity = await agent.Activities.details(id);
                runInAction('Getting Activity', () => {
                    setActivityProps(activity, this.rootStore.userStore.user!);
                    this.activity = activity;
                    this.activityRegistry.set(activity.id, activity);
                    this.loadingInitial = false;
                });
                return activity;


            } catch (error) {
                runInAction('Getting Activity Error', () => {
                    this.loadingInitial = false;
                })
                console.log(error);
            }
        }

    }

    @action clearActivity = () => {
        this.activity = null;
    }

    getActivity(id: string) {
        return this.activityRegistry.get(id);
    }

    @action createActivity = async (activity: IActivity) => {
        this.submitting = true;
        try {
            await agent.Activities.create(activity);
            const attendee = createAttendee(this.rootStore.userStore.user!);
            attendee.isHost = true;
            let attendees = [];
            attendees.push(attendee);
            activity.isHost = true;
            activity.attendees = attendees;
            activity.comments = [];
            runInAction('Creating activity', () => {
                this.activityRegistry.set(activity.id, activity);
                this.submitting = false;
            });
            history.push(`/activities/${activity.id}`);
        } catch (error) {
            runInAction('Creating Activity error', () => {
                this.submitting = false;
            });
            toast.error('Problem submitting data');
            console.log(error.response);

        }
    }

    @action editActivity = async (activity: IActivity) => {
        this.submitting = true;
        try {
            await agent.Activities.update(activity);
            runInAction('Editing Activity', () => {
                this.activityRegistry.set(activity.id, activity);
                this.activity = activity;
                this.submitting = false;
            });
            history.push(`/activities/${activity.id}`);
        } catch (error) {
            runInAction('Editing Activity error', () => {
                this.submitting = false;
            });
            toast.error('Problem submitting data');
            console.log(error.response);
        }
    }

    @action deleteActivity = async (event: SyntheticEvent<HTMLButtonElement>, id: string) => {
        this.submitting = true;
        this.target = event.currentTarget.name;
        try {
            await agent.Activities.delete(id);

            runInAction('Deleting Activity', () => {
                this.activityRegistry.delete(id);
                this.submitting = false;
                this.target = '';
            })
        } catch (error) {
            runInAction('Deleting Activity error', () => {
                this.submitting = false;
                this.target = '';
            })
            console.log(error);

        }
    }

    @action attendActivity = async () => {
        const attendee = createAttendee(this.rootStore.userStore.user!);
        this.loading = true;
        try {
            await agent.Activities.attend(this.activity!.id);
            runInAction(() => {
                if (this.activity) {
                    this.activity.attendees.push(attendee);
                    this.activity.isGoing = true;
                    this.activityRegistry.set(this.activity.id, this.activity);
                    this.loading = false;
                }
            });
        } catch (error) {
            runInAction(() => {
                this.loading = false;

            });
            toast.error('Problem signing up to activity');
        }

    }

    @action cancelAttendance = async () => {
        this.loading = true;

        try {

            await agent.Activities.unattend(this.activity!.id);
            runInAction(() => {
                if (this.activity) {
                    this.activity.attendees = this.activity
                        .attendees.filter(x => x.username !== this.rootStore.userStore.user!.username);
                    this.activity.isGoing = false;
                    this.activityRegistry.set(this.activity.id, this.activity);
                    this.loading = false;
                }
            });

        } catch (error) {
            runInAction(() => {
                this.loading = false;

            });
            toast.error('Problem cancelling attendance');
        }

    }

}

