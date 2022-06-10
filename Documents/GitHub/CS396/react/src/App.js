import React from 'react';
import NavBar from './NavBar';
import Profile from './Profile';
import Stories from './Stories';
import Suggestions from './Suggestions';
import Posts from './Posts';
import { getHeaders } from './utils';

class App extends React.Component {

    constructor(props) {
        super(props);
        this.getProfileFromServer();
        this.state = {
            user: {}
        }
    }

    getProfileFromServer() {
        fetch('/api/profile', {
            headers: getHeaders()
        }).then(response => response.json())
        .then(data => {
            this.setState({
                user: data
            })
        });
    }

    render () {
        return (
            <div>
                <NavBar title="Photo App" username={this.state.user.username} />
                <aside>
                    <Profile user={this.state.user}/>
                    <Suggestions />
                </aside>

                <main className="content">
                    <Stories />
                    <Posts />
                </main>
            </div>
        );
    }
}

export default App;