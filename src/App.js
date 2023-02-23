import React, { useState, useEffect } from "react";
import "@aws-amplify/ui-react/styles.css";
import './App.css';
import { API, Storage } from "aws-amplify";
import {
  withAuthenticator,
  Button,
  Heading,
  Flex,
  Image,
  View,
  TextField,
  Text,
  Divider,
  Card,
  useTheme
} from "@aws-amplify/ui-react";
import { listNotes } from "./graphql/queries";
import {
  createNote as createNoteMutation,
  deleteNote as deleteNoteMutation,
} from "./graphql/mutations";

const App = ({ signOut }) => {
  const [notes, setNotes] = useState([]);
  const { tokens } = useTheme();

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(
      notesFromAPI.map(async (note) => {
        if (note.image) {
          const url = await Storage.get(note.name);
          note.image = url;
        }
        return note;
      })
    );
    setNotes(notesFromAPI);
  }

  async function createNote(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const image = form.get("image");
    const data = {
      name: form.get("name"),
      description: form.get("description"),
      image: image.name,
    };
    console.log("data: ", data);
    if (!!data.image) await Storage.put(data.name, image);
    await API.graphql({
      query: createNoteMutation,
      variables: { input: data },
    });
    fetchNotes();
    event.target.reset();
  }

  async function deleteNote({ id, name }) {
    const newNotes = notes.filter((note) => note.id !== id);
    setNotes(newNotes);
    await Storage.remove(name);
    await API.graphql({
      query: deleteNoteMutation,
      variables: { input: { id } },
    });
  }


  return(
    <View className="App">
      <Heading level={1}>My Notes App</Heading>
      <View as="form" margin="3rem 0" onSubmit={createNote}>
        <Flex direction="row" justifyContent="center">
          
          <TextField
            name="name"
            placeholder="Note name"
            label="Note Name"
            labelHidden
            variation="quiet"
            required
          />
          <TextField 
            name="description"
            placeholder="Note Description"
            label="Note Description"
            labelHidden
            variation="quiet"
            required
          />
          <View
            border="1px solid var(--amplify-colors-black)"
            borderRadius="20px"
            color="var(--amplify-colors-blue-60)"
            name="image"
            as="input"
            type="file"
            style={{ alignSelf: "start" }}
          />
          <Button type="submit" variation="primary">
            Create Note
          </Button>
        </Flex>
      </View>
      <Heading 
        level={2}
        paddingBottom="15px"
        color="green.100"
      >Current Notes</Heading>
      <Flex 
        notes={notes}
        type="list"
        direction="row"
        gap="20px"
        wrap="nowrap"
        justifyContent="center"
      >
        {notes.map((note) =>(
          <Card
            key={note.id || note.name}
            borderRadius="25px"
            backgroundColor="blue.10"
            maxWidth="22rem"
            variation="outlined"
            maxHeight="25rem"
          >
            <View>
              <Text as="strong" fontWeight={700}>
                {note.name}
              </Text>
              <Divider orientation="row"/>
              <Text as="span">{note.description}</Text>
            </View>
            <Card>
              {note.image && (
                <Image
                  src={note.image}
                  alt={`visual aid for ${notes.name}`}
                  style={{ width: 100 }}
                  objectPosition="50% 50%"   
                />
              )}
            </Card>
            <Divider padding="relative.xxxs" />
            <Button 
              variation="link" 
              onClick={() => deleteNote(note)}
              border="2px solid black"
              padding="4px 4px"
             >
              Delete Note
            </Button>
          </Card>
        ))}
      </Flex>
      <Divider orientation="column" paddingTop="100px" />
      <Button onClick={signOut}>Sign Out</Button>
    </View>
  );
}

export default withAuthenticator(App);