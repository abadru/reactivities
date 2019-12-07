import {RootStore} from "./rootStore";
import {action, observable, runInAction, computed} from "mobx";
import {IPhoto, IProfile} from "../models/profile";
import agent from "../api/agent";
import {toast} from "react-toastify";

export default class ProfileStore {
    rootStore: RootStore;
    @observable profile: IProfile | null = null;
    @observable loadingProfile = true;
    @observable uploadingPhoto = false;
    @observable loading = false;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    @computed get isCurrentUser() {
        if (this.rootStore.userStore.user && this.profile) {
            return this.rootStore.userStore.user.username === this.profile.username;
        }

        return false;
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
}