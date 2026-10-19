import React, { Component,Fragment } from 'react'
import { Search } from 'react-feather';
import {withRouter} from 'react-router-dom'

export class SearchHeader extends Component {
    constructor(props) {
        super(props)
        this.state = {
            searchbar: false,
            searchFor:''
        }
    }
    handleSearchClick = () => {
        this.setState({
            searchbar: !this.state.searchbar
        })
    }

    handleChange =(e)=>{
        const {name,value} = e.target
        this.setState({[name]:value})
    }

    handleSubmit =(e)=>{
        e.preventDefault()
        this.props.history.push(`/searched-order/${this.state.searchFor}`)
        this.setState({
            searchbar: false,
            searchFor:''
        })

    }

    render() {
        return (
            <Fragment>
                <form className="form-inline search-form" onSubmit={this.handleSubmit}> 
                    <div className="form-group">
                        <input className={"form-control-plaintext " + (this.state.searchbar ? 'open' : '')} name='searchFor' value={this.state.searchFor} type="search" placeholder="ট্র্যাক অর্ডার..." onChange={this.handleChange} />
                        <span className="d-sm-none mobile-search" onClick={() => this.handleSearchClick()}><Search /></span>
                    </div>
                </form>
            </Fragment>
        )
    }
}

export default withRouter(SearchHeader);
