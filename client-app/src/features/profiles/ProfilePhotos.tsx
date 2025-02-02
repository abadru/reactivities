// @flow
import * as React from 'react';
import {Card, Header, Tab, Image, Button, Grid} from "semantic-ui-react";
import {useContext, useState} from "react";
import {RootStoreContext} from "../../app/stores/rootStore";
import {observer} from "mobx-react-lite";
import PhotoUploadWidget from "../../app/common/photoUpload/PhotoUploadWidget";

type Props = {};

const ProfilePhotos = (props: Props) => {
    const rootStore = useContext(RootStoreContext);
    const {profile, isCurrentUser, uploadingPhoto, uploadPhoto, setMainPhoto, loading, deletePhoto} = rootStore.profileStore;
    const [addPhotoMode, setAddPhotoMode] = useState(false);
    const [target, setTarget] = useState<string | undefined>(undefined);
    const [deleteTarget, setDeleteTarget] = useState<string | undefined>(undefined);

    const handleUploadImage = (photo: Blob) => {
        uploadPhoto(photo).then(() => {
            setAddPhotoMode(false);
        })
    }
    return (
        <Tab.Pane>

            <Grid>
                <Grid.Column width={16} style={{paddingBottom: 0}}>
                    <Header floated='left' icon='image' content='Photos'/>
                    {isCurrentUser && (
                        <Button
                            floated='right'
                            basic
                            content={addPhotoMode ? 'Cancel' : 'Add Photo'}
                        onClick={() => setAddPhotoMode(!addPhotoMode)}></Button>
                    )}
                </Grid.Column>
                <Grid.Column width={16}>
                    {addPhotoMode ? (
                        <PhotoUploadWidget uploadPhoto={handleUploadImage} loading={uploadingPhoto} />
                    ) : (
                        <Card.Group itemsPerRow={5}>
                            {profile && profile.photos.map((photo => (
                                <Card key={photo.id}>
                                    <Image src={photo.url}/>
                                    {isCurrentUser && (
                                        <Button.Group fluid widths={2}>
                                            <Button
                                                name={photo.id}
                                                loading={loading && target === photo.id}
                                                onClick={(e) => {
                                                    setMainPhoto(photo);
                                                    setTarget(e.currentTarget.name)
                                                }}
                                                disabled={photo.isMain}
                                                basic
                                                positive
                                                content='Main'/>
                                            <Button
                                                name={photo.id}
                                                basic
                                                negative
                                                disabled={photo.isMain}
                                                loading={loading && deleteTarget === photo.id}
                                                onClick={(e) => {
                                                    deletePhoto(photo);
                                                    setDeleteTarget(e.currentTarget.name);
                                                }}
                                                icon='trash'/>
                                        </Button.Group>
                                    )}

                                </Card>
                            )))}
                        </Card.Group>
                    )}

                </Grid.Column>
            </Grid>


        </Tab.Pane>
    );
};

export default observer(ProfilePhotos);