export interface IActivity {
    id: string;
    title: string;
    description: string;
    category: string;
    date: Date;
    city: string;
    venue: string;
    attendees: IAttenddee[];
    comments: IComment[];
    isGoing: boolean;
    isHost: boolean;
}

export interface IActivityFormValues extends Partial<IActivity> {
    time?: Date;
    
}

export class ActivityFormValues implements IActivityFormValues {
    id?: string = undefined;
    title: string = '';
    category: string = '';
    description: string = '';
    date?: Date = undefined;
    time?: Date = undefined;
    city: string = '';
    venue: string = '';

    constructor(init?: IActivityFormValues) {
        if (init && init.date) {
            init.time = init.date;
        }
        Object.assign(this, init);
    }
}

export interface IAttenddee {
    username: string;
    displayName: string;
    image: string;
    isHost: boolean;
    following?: boolean;
}

export interface IComment {
    id: string;
    createdAt: Date;
    body: string;
    username: string;
    displayName: string;
    image: string;

}