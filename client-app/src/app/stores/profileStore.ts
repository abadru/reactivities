import {RootStore} from "./rootStore";
import {action, observable, runInAction, computed, reaction} from "mobx";
import {IPhoto, IProfile} from "../models/profile";
import agent from "../api/agent";
import {toast} from "react-toastify";

export default class ProfileStore {
    rootStore: RootStore;
    @observable profile: IProfile | null = null;
    @observable loadingProfile = true;
    @observable uploadingPhoto = false;
    @observable loading = false;
    @observable followings: IProfile[] = [];

    @observable activeTab: number = 0;



    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;

        reaction(
            () => this.activeTab,
            activeTab => {
                if(activeTab ===3 || activeTab ===4){
                    const predicate = activeTab ===3? 'followers': 'following';
                    this.loadFollowings(predicate);
                } else {
                    this.followings = [];
                }
            }
        )
    }

    @computed get isCurrentUser() {
        if (this.rootStore.userStore.user && this.profile) {
            return this.rootStore.userStore.user.username === this.profile.username;
        }

        return false;
    }

    @action setActiveTab = (activeIndex: number) => {
        this.activeTab = activeIndex;
    }

    @action loadProfile = async (username: string) => {
        this.loadingProfile = true;

        try {
            const profile = await agent.Profiles.get(username);

            runInAction(() => {
                this.profile = profile;
                this.loadingProfile = false;
            });
        } catch (error) {
            runInAction(() => {
                this.loadingProfile = false;
            });
            console.log(error);

        }
    }

    @action uploadPhoto = async (file: Blob) => {
        this.uploadingPhoto = true;

        try {
            const photo = await agent.Profiles.uploadPhoto(file);
            runInAction(() => {
                if (this.profile) {
                    this.profile.photos.push(photo);
                    if (photo.isMain && this.rootStore.userStore.user) {
                        this.rootStore.userStore.user.image = photo.url;
                        this.profile.image = photo.url;
                    }
                    this.uploadingPhoto = false;
                }
            });

        } catch (e) {
            console.log(e);
            toast.error('Problem uploading photo');
            runInAction(() => {
                this.uploadingPhoto = false;
            });
        }
    }

    @action setMainPhoto = async (photo: IPhoto) => {
        this.loading = true;

        try {

            await agent.Profiles.setMainPhoto(photo.id);
            runInAction(() => {
                this.rootStore.userStore.user!.image = photo.url;
                this.profile!.photos.find(f => f.isMain)!.isMain = false;
                this.profile!.photos.find(f => f.id === photo.id)!.isMain = true;
                this.profile!.image = photo.url;
                this.loading = false;
            });

        } catch (e) {
            console.log(e);
            toast.error('Problem setting main photo');
            runInAction(() => {
                this.loading = false;
            });
        }

    }

    @action deletePhoto = async (photo: IPhoto) => {
        this.loading = true;

        try {
            await agent.Profiles.deletePhoto(photo.id);
            runInAction(() => {
                this.profile!.photos = this.profile!.photos.filter(f => f.id !== photo.id);
                this.loading = false;
            });

        } catch (e) {
            console.log(e);
            toast.error('Problem deleting the photo');
            runInAction(() => {
                this.loading = false;
            })
        }
    }

    @action updateProfile = async (profile: Partial<IProfile>) => {
        try {

            await agent.Profiles.updateProfile(profile);
            runInAction(() => {
                if(this.profile!.displayName !== this.rootStore.userStore.user!.displayName){
                    this.rootStore.userStore.user!.displayName = profile.displayName!;
                }
                this.profile = {...this.profile!, ...profile};
            });

        } catch (e) {
            console.log(e);
            toast.error('Problem setting main photo');
        }
    }

    @action follow = async (username: string) => {
        this.loading = true;
        try {

            await agent.Profiles.follow(username);
            runInAction(() => {
                this.profile!.following = true;
                this.profile!.followersCount++;
                this.loading = false;
            });

        } catch (e) {
            console.log(e);
            toast.error('Problem following user');
            runInAction(() => {
                this.loading = false;
            })
        }
    }

    @action unfollow = async (username: string) => {
        this.loading = true;
        try {

            await agent.Profiles.unfollow(username);
            runInAction(() => {
                this.profile!.following = false;
                this.profile!.followersCount--;
                this.loading = false;
            });

        } catch (e) {
            console.log(e);
            toast.error('Problem unfollowing user');
            runInAction(() => {
                this.loading = false;
            })
        }
    }

    @action loadFollowings = async (predicate: string) => {
        this.loading = true;

        try {

            const profiles = await agent.Profiles.listFollowings(this.profile!.username, predicate);

            runInAction(() => {
                this.followings = profiles;
                this.loading = false;
            });

        } catch (e) {
            toast.error('Problem loading followings');
            runInAction(() => {
                this.loading = false;
            });
        }
    }
}