import React, { Component } from 'react';
import axios from 'axios';
import { sortBy } from 'lodash';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import logo from './logo.svg';
import './App.css';

/* Vendor Libraries */
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
	faSpinner, 
	faArrowUp, faArrowDown, 
	faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons'

library.add({ 
	faSpinner, 
	faArrowUp, faArrowDown, 
	faSortUp, faSortDown });
/* End Vendor Libraries */

const DEFAULT_QUERY = 'cyber security';
const DEFAULT_HPP = '5';

const PATH_BASE = 'https://hn.algolia.com/api/v1';
const PATH_SEARCH = '/search';
const PARAM_SEARCH = 'query=';
const PARAM_PAGE = 'page=';
const PARAM_HPP = 'hitsPerPage=';

const SORTS = {
	NONE: list => list,
	TITLE: list => sortBy(list, 'title'),
	AUTHOR: list => sortBy(list, 'author'),
	COMMENTS: list => sortBy(list, 'num_comments').reverse(),
	POINTS: list => sortBy(list, 'points').reverse(),
};

const themes = {
  light: {
    foreground: '#000000',
    background: '#eeeeee',
  },
  dark: {
    foreground: '#ffffff',
    background: '#222222',
  },
};

const ThemeContext = React.createContext(
  themes.light // default value
);

// When using a function, setState will call the function with two properties, prevState and props
const updateSearchTopStoriesState = function(hits, page) {
	return function(prevState, props) {
	  const { searchKey } = prevState;

    const cachedResult = sessionStorage.getItem(searchKey);
    const parseResult = cachedResult && JSON.parse(cachedResult);
    let oldHits = [];
    if (cachedResult) {    	
      oldHits = parseResult.hits || [];
    }

	  const updatedHits = [
	    ...oldHits,
	    ...hits
	  ];

	  sessionStorage.setItem(searchKey, JSON.stringify({
  			hits: updatedHits,
  			page: page
	  	})
	  );

	 	return {
	 		result: { hits: updatedHits, page },
	 		isLoading: false,
	 		searchKey: searchKey
	 	} 
	};
}

class App extends Component {
	
	_isMounted = false;

	constructor(props) {
		super(props);

		this.state = {
			result: null,
			searchKey: '',
			searchTerm: DEFAULT_QUERY,
			error: null,
			isLoading: false,
			themes: themes
		};
	}

	setSearchTopStories = (result) => {
		const { hits, page } = result;
		this.setState(updateSearchTopStoriesState(hits, page));
	}

	fetchSearchTopStories = (searchTerm, page = 0) => {		
		const cachedResult = sessionStorage.getItem(searchTerm);		
		const parsedResult = cachedResult && JSON.parse(cachedResult);

		console.log("test");

		if(parsedResult && parsedResult.page >= page) {
			this.setState({
				result: {
					hits: parsedResult.hits,
					page: parsedResult.page
				}
			})
			return;
		}

		this.setState({ isLoading: true });

		axios(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAULT_HPP}`)
			.then(result => {
					this.setState({ isLoading: false });
					this._isMounted && this.setSearchTopStories(result.data)
				}
			)
			.catch(error => this._isMounted && this.setState({ error }));
	}

	componentDidMount() {
		this._isMounted = true;

		const { searchTerm } = this.state;

		this.setState({ searchKey: searchTerm });
		this.fetchSearchTopStories(searchTerm);
	}

	componentWillUnmount() {
		this._isMounted = false;
	}

	onSearchSubmit = (event) => {
		event.preventDefault();

		const { searchTerm } = this.state;
		this.setState({ searchKey: searchTerm });

		this.fetchSearchTopStories(searchTerm);
	}

	onDismiss = (id) => {
		const { searchKey, result } = this.state;
		const { hits, page } = result;

		const isNotId = item => item.objectID !== id;
		const updatedHits = hits.filter(isNotId);
		const newResult = { hits: updatedHits, page };

	  sessionStorage.setItem(searchKey, JSON.stringify(newResult));

		this.setState({
			result: { ...newResult }
		})
	}

	onSearchChange = (event) => {
		this.setState({
			searchTerm: event.target.value
		});
	}

	render() {
		const { 
			searchTerm, 
			result, 
			searchKey, 
			error, 
			isLoading,
			themes
		} = this.state;

		const page = (result && result.page) || 0;
		const list = (result && result.hits) || [];

		return (
			<div className="page" style={{backgroundColor: themes.light.background}}>
				<div className="interactions">
					<Search
						value={searchTerm}
						onChange={this.onSearchChange}
						onSubmit={this.onSearchSubmit}
					>
						Search
					</Search>
				</div>
				{
					error
					? <div className="interactions">
							<p>Something went wrong.</p>
						</div>
					:
					<Table
						list={list}
						onDismiss={this.onDismiss}
					/>
				}
				<div className="interactions">
					<ButtonWithLoading 
						isLoading={isLoading} 
						onClick={() => this.fetchSearchTopStories(searchKey, page + 1)}>
						More
					</ButtonWithLoading>
				</div>
			</div>								
		);
	}
}

class Search extends Component {

	componentDidMount() {
		if (this.input) {
			this.input.focus();
		}
	}

	render() {
		const {
			value,
			onChange, 
			onSubmit,
			children
		} = this.props;

		return (
			<form onSubmit={onSubmit}>
				{children} <input
					type="text"
					value={value}
					onChange={onChange}
					ref={el => this.input = el}
				/>
				<button type="submit">
					{children}
				</button>
			</form>
		);
	};
}

Search.propTypes = {
	value: PropTypes.string, 
	onChange: PropTypes.func,
	onSubmit: PropTypes.func,
	children: PropTypes.node.isRequired
};

class Table extends Component {

	constructor(props) {
		super(props);

		this.state = {
			sortKey: 'NONE',
			isSortReverse: false
		};
	}

	onSort = (sortKey) => {
		const isSortReverse = this.state.sortKey === sortKey && !this.state.isSortReverse;
		this.setState({ sortKey, isSortReverse });
	}

	render() {
		const {
      list,
      onDismiss
    } = this.props;

    const {
    	sortKey,
    	isSortReverse
    } = this.state;

    const sortedList = SORTS[sortKey](list);
    const reverseSortedList = isSortReverse
      ? sortedList.reverse()
      : sortedList;

		return (
			<div className="tables">
				<div className="table-header">
					<span style={{ width: '40%' }}>
						<Sort
							sortKey={'TITLE'}
							onSort={this.onSort}
							activeSortKey={sortKey}
							isSortReverse={isSortReverse}						
						>
							Title
						</Sort>
					</span>
					<span style={{ width: '30%' }}>
						<Sort
							sortKey={'AUTHOR'}
							onSort={this.onSort}
							activeSortKey={sortKey}
							isSortReverse={isSortReverse}
						>
							Author
						</Sort>
					</span>
					<span style={{ width: '10%' }}>
						<Sort
							sortKey={'COMMENTS'}
							onSort={this.onSort}
							activeSortKey={sortKey}
							isSortReverse={isSortReverse}
						>
							Comments
						</Sort>
					</span>
					<span style={{ width: '10%' }}>
						<Sort
							sortKey={'POINTS'}
							onSort={this.onSort}
							activeSortKey={sortKey}
							isSortReverse={isSortReverse}
						>
							Points
						</Sort>
					</span>
					<span style={{ width: '10%' }}>
						Archive
					</span>
				</div>

				{reverseSortedList.map(item =>
					<div key={item.objectID} className="table-row">
						<span style={{ width: '40%' }}>
							<a href={item.url}>{item.title}</a>
						</span>
						<span style={{ width: '30%' }}>{item.author}</span>
						<span style={{ width: '10%' }}>{item.num_comments}</span>
						<span style={{ width: '10%' }}>{item.points}</span>
						<span style={{ width: '10%' }}>          
							<Button onClick={() => onDismiss(item.objectID)} className="button-inline">
								Dismiss
							</Button>
						</span>
					</div>
				)}		
			</div>
		);        
	};
}

Table.propTypes = {
	list: PropTypes.array.isRequired,
	onDismiss: PropTypes.func.isRequired,
};

const Button = ({onClick, className, children}) =>
	<button
		onClick={onClick}
		className={className}
		type="button"
	>
		{children}
	</button>

Button.propTypes = {
	onClick: PropTypes.func.isRequired, 
	className: PropTypes.string,
	children: PropTypes.node.isRequired
};

Button.defaultProps = {
	className: '',
};

const Loading = () =>
	<div> <FontAwesomeIcon icon="spinner" spin /></div>

const withLoading = (Component) => ({isLoading, ...rest}) =>
	isLoading
		? <Loading />
		: <Component { ...rest } />

const ButtonWithLoading = withLoading(Button);

const Sort = ({
	sortKey,
	activeSortKey,
	onSort,
	isSortReverse,
	children
	}) => {	
	const sortClass = classNames(
    'button-inline',
    { 'button-active': sortKey === activeSortKey }
  );

  const upOrDownArrowIcon = isSortReverse === true ? "arrow-down" : "arrow-up"

	return (
		<Button
			onClick={() => onSort(sortKey)}
			className={sortClass}
		>
			{children}
			&nbsp;
			{ sortKey === activeSortKey && 
				<FontAwesomeIcon icon={upOrDownArrowIcon} />
			}
		</Button>
	);
}

export default App;

export {
	Button, Search, Table, updateSearchTopStoriesState
}

