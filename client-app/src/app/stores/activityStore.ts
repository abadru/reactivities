import {action, observable, computed, configure, runInAction} from "mobx";
import {createContext, SyntheticEvent} from "react";
import {IActivity} from "../models/activity";
import agent from "../api/agent";
import {history} from "../../index";
import {toast} from "react-toastify";


configure({
    enforceActions: "always"
});

class ActivityStore {
    @observable activityRegistry = new Map();
    @observable activity: IActivity | null = null;
    @observable loadingInitial = false;
    @observable submitting = false;
    @observable target = '';

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
                    activity.date = new Date(activity.date);
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
                    activity.date = new Date(activity.date);
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

}

export default createContext(new ActivityStore());