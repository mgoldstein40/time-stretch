import React from 'react';

class Profile extends React.Component {  

    constructor(props) {
        super(props);
    }

    componentDidMount() {
    }

    render () {
        const user = this.props.user;
        return (
            <header>
                <div>
                    <img className="pic" src={user.thumb_url} alt={"Profile picture of " + user.username} />
                    <h2>{user.username}</h2>
                </div>
            </header>  
        );
    }
}

export default Profile;