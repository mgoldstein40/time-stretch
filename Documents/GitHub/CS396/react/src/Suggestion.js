import React from 'react';
import {getHeaders} from './utils';

class Suggestion extends React.Component {  

    constructor(props) {
        super(props);
        this.state = {
            suggestion: this.props.model,
            followId: null
        }
        this.toggleFollow = this.toggleFollow.bind(this);
        this.follow = this.follow.bind(this);
        this.unfollow = this.unfollow.bind(this);
    }

    toggleFollow(ev) {
        if (this.state.followId) {
            this.unfollow();
        } else {
            this.follow();
        }
    }

    follow() {
        const followData = {
            user_id: this.state.suggestion.id
        };
        fetch('/api/following', {
            headers: getHeaders(),
            method: 'POST',
            body: JSON.stringify(followData)
        }).then(response => response.json())
        .then(data => {
            this.setState({
                suggestion: this.state.suggestion,
                followId: data.id
            });
        });
    }

    unfollow() {
        fetch(`/api/following/${this.state.followId}`, {
            headers: getHeaders(),
            method: 'DELETE'
        }).then(response => response.json())
        .then(data => {
            this.setState({
                suggestion: this.state.suggestion,
                followId: null
            });
        });
    }

    requerySuggestion() {
        fetch('/api/following/', {
            headers: getHeaders()
        })
        .then(response => response.json())
        .then(data => {
            this.setState({ 
                suggestion: data
            });
        });
    }
    
    render () {
        const suggestion = this.state.suggestion;
        if (!suggestion) {
            return (
                <div></div>  
            );
        }
        return (
            <section>
                <img className="pic" src={suggestion.thumb_url} alt={"Profile pic for " + suggestion.username} />
                <div>
                    <p className="username">{suggestion.username}</p>
                    <p className="suggestion-text">suggested for you</p>
                </div>
                <div>
                    <button
                        className="link"
                        role="switch"
                        aria-checked={this.state.followId ? "false" : "true"}
                        aria-label={"Follow " + suggestion.username}
                        onClick={this.toggleFollow}
                    >
                        {this.state.followId ? "unfollow" : "follow"} 
                    </button>
                </div>
            </section>
        );     
    }
}

export default Suggestion;