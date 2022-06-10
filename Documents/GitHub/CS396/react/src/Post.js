import React from 'react';
import AddComment from './AddComment';
import BookmarkButton from './BookmarkButton';
import LikeButton from './LikeButton';
import {getHeaders} from './utils';

class Post extends React.Component {  

    constructor(props) {
        super(props);
        this.state = {
            post: this.props.model
        }

        this.requeryPost = this.requeryPost.bind(this);
    }

    requeryPost() {
        fetch(`/api/posts/${this.state.post.id}`, {
                headers: getHeaders()
            })
            .then(response => response.json())
            .then(data => {
                this.setState({ 
                    post: data
                });
            });
    }
    
    render () {
        const post = this.state.post;
        const n = post.comments.length;
        if (!post) {
            return (
                <div></div>  
            );
        }
        return (
            <section className="card">
                <div className="header">
                    <h3>{post.user.username}</h3>
                    <i className="fa fa-dots"></i>
                </div>
                
                <img 
                    src={post.image_url} 
                    alt={'Image posted by ' +  post.user.username} 
                    width="300" 
                    height="300"
                />
                
                <div className="info">
                    <div className="buttons">
                        <LikeButton 
                            postId={post.id} 
                            likeId={post.current_user_like_id}
                            requeryPost={this.requeryPost}
                        />
                        <BookmarkButton 
                            postId={post.id} 
                            bookmarkId={post.current_user_bookmark_id}
                            requeryPost={this.requeryPost}
                        />
                    </div>
                    <p>{ post.caption }</p>
                </div>
                {
                    (n > 1) ?
                        <div className="comments">
                            <button className="link">
                                View all {n} comments
                            </button>
                            <p>
                                <strong>{post.comments[n - 1].user.username} </strong>{post.comments[n - 1].text}
                            </p>
                            <p className="timestamp">
                                {post.comments[n - 1].display_time}
                            </p>
                        </div>
                    : (post.comments && n > 0) ?
                        <div className="comments">
                            <p>
                                <strong>{post.comments[0].user.username} </strong>{post.comments[0].text}
                            </p>
                            <p className="timestamp">
                                {post.comments[0].display_time}
                            </p>
                        </div>
                    :
                        <div className="comments"></div>
                }
                <div className="add-comments">
                    <AddComment
                        postId={post.id}
                        requeryPost={this.requeryPost}
                    /> 
                </div>
            </section> 
        );     
    }
}

export default Post;