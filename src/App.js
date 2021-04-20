import React, { useState, useEffect } from 'react';
import './App.css';
import { API } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';

import { listUsers } from './graphql/queries';
import { createUser as createUserMutation, deleteUser as deleteUserMutation } from './graphql/mutations';
import { Storage } from 'aws-amplify';

const initialFormState = { name: '', image: '' }

function App() {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const apiData = await API.graphql({ query: listUsers });
    const usersFromAPI = apiData.data.listUsers.items;
    await Promise.all(usersFromAPI.map(async user => {
      if (user.image) {
        const image = await Storage.get(user.image);
        user.image = image;
      }
      return user;
    }))
    setUsers(apiData.data.listUsers.items);
  }

  async function createUser() {
    if (!formData.name) return;
    await API.graphql({ query: createUserMutation, variables: { input: formData } });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setUsers([ ...users, formData ]);
    setFormData(initialFormState);
  }

  async function deleteUser({ id }) {
    const newUsersArray = users.filter(user => user.id !== id);
    setUsers(newUsersArray);
    await API.graphql({ query: deleteUserMutation, variables: { input: { id } }});
  }

  async function onChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchUsers();
  }

  return (
    <div className="App">
      <h1>My Users App</h1>
      <input
        onChange={e => setFormData({ ...formData, 'name': e.target.value})}
        placeholder="User name"
        value={formData.name}
      />
      <input
        type="file"
        onChange={onChange}
      />
      <button onClick={createUser}>Create User</button>
      <div style={{marginBottom: 30}}>
        {
          users.map(user => (
            <div key={user.id || user.name}>
              <h2>{user.name}</h2>
              <button onClick={() => deleteUser(user)}>Delete user</button>
              {
                user.image && <img src={user.image} style={{width: 400}} />
              }
            </div>
          ))
        }
      </div>
      <AmplifySignOut />
    </div>
  );
}

export default withAuthenticator(App);
