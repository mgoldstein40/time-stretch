import React from 'react';
import {getHeaders} from './utils';

class AddComment extends React.Component {  

    constructor(props) {
        super(props);
        this.state = {
            text: ''
        };
        this.addComment = this.addComment.bind(this);
        this.onType = this.onType.bind(this);
    }

    onType(e) {
        this.setState({
            text: e.target.value
        });
    }

    addComment() {
        if (this.state.text !== '') {
            console.log(this.state.text);
            const postData = {
                post_id: this.props.postId,
                text: this.state.text
            };
            fetch("/api/comments/", {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(postData)
            })
            .then(response => response.json())
            .then(data => {
                this.props.requeryPost();
                this.setState({
                    text: ''
                });
            });
        };
    };

    render () {
        const postId = this.props.postId;
        return (
            <div className="add-comment">
                <input
                    id={"input_" + postId}
                    className="comment-input"
                    type="text"
                    placeholder="Add a comment..."
                    onChange={this.onType}
                    value={this.state.text}
                />
                <button
                    className="link"
                    onClick={this.addComment}
                >
                    Post
                </button>
            </div>
        ) 
    }
}
// value={this.state.text}
export default AddComment;