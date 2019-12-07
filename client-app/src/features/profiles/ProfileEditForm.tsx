// @flow
import * as React from 'react';
import {observer} from "mobx-react-lite";
import {IProfile} from "../../app/models/profile";
import {Form as FinalForm, Field} from 'react-final-form';
import {combineValidators, isRequired} from "revalidate";
import {Button, Form} from "semantic-ui-react";
import TextInput from "../../app/common/form/TextInput";
import TextAreaInput from "../../app/common/form/TextAreaInput";

const validate = combineValidators({
    displayName: isRequired('displayName')
})

interface IProps {
    updateProfile: (profile: Partial<IProfile>) => void;
    profile: IProfile;
}

const ProfileEditForm: React.FC<IProps> = ({profile, updateProfile}) => {
    return (
        <FinalForm
            onSubmit={updateProfile}
            validate={validate}
            initialValues={profile!}
            render={({handleSubmit, invalid, pristine, submitting}) => (
                <Form onSubmit={handleSubmit} error>
                    <Field name='displayName'  component={TextInput} placeHolder='DisplayName' value={profile!.displayName}/>
                    <Field name='bio'  component={TextAreaInput} placeHolder='Bio' value={profile!.bio}/>
                    <Button
                        loading={submitting}
                        floated='right'
                        disabled={invalid || pristine}
                        positive
                        content='Update Profile'
                    />
                </Form>
            )}
        />
    );
};

export default observer(ProfileEditForm);