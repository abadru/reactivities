// @flow
import * as React from 'react';
import {List, Image, Popup} from "semantic-ui-react";
import {IAttenddee} from "../../../app/models/activity";

interface IProps {
    attendees: IAttenddee[]
}

const  ActivityListItemAttendees: React.FC<IProps> = ({attendees}) => {
    return (
        <List horizontal>
            {attendees.map((attendee) =>(
                <List.Item key={attendee.username}>
                    <Popup
                        header={attendee.displayName}
                        trigger={<Image size='mini' circular src={attendee.image || '/assets/user.png'}></Image>} />

                </List.Item>
            ))}
        </List>
    );
};

export default ActivityListItemAttendees;