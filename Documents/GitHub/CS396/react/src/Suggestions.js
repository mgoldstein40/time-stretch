import React from 'react';
import Suggestion from './Suggestion';
import {getHeaders} from './utils';


class Suggestions extends React.Component {  
    constructor(props) {
        super(props);
        this.state = { suggestions: [] };
        this.fetchSuggestions = this.fetchSuggestions.bind(this);
    }

    componentDidMount() {
        this.fetchSuggestions();
    }

    fetchSuggestions() {
        fetch('/api/suggestions', {
                headers: getHeaders()
            })
            .then(response => response.json())
            .then(data => {
                this.setState({ suggestions: data });
            })
    }

    render () {
        return (
            <div className="suggestions">
                {
                    this.state.suggestions.map(suggestion => {
                        return (
                            <Suggestion model={suggestion} key={'suggestion-' + suggestion.id} />
                        )
                    })
                }
            </div> 
        );   
    }
}

export default Suggestions;