import React from 'react';
import ReactDOM from 'react-dom';
import renderer from 'react-test-renderer';
import Enzyme, { shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import App, { 
  Search, 
  Button, 
  Table, 
  updateSearchTopStoriesState } from './App';

Enzyme.configure({ adapter: new Adapter() });

describe('App', () => {
	
	it('renders without crashing', () => {
	  const div = document.createElement('div');
	  ReactDOM.render(<App />, div);
	  ReactDOM.unmountComponentAtNode(div);
	});	

	test('has a valid snapshot', () => {
    const component = renderer.create(
      <App />
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

});

describe('Search', () => {

  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<Search>Search</Search>, div);
    ReactDOM.unmountComponentAtNode(div);
  });

	test('has a valid snapshot', () => {
    const component = renderer.create(
      <Search>Search</Search>
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

});

describe('Button', () => {

	const onButtonClick = () => alert();

  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<Button onClick={onButtonClick}>Give Me More</Button>, div);
    ReactDOM.unmountComponentAtNode(div);
  });

  test('has a valid snapshot', () => {
    const component = renderer.create(
      <Button onClick={onButtonClick}>Give Me More</Button>
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders children when passed in', () => {
  	const element = shallow((<Button onClick={onButtonClick}>
  		Children Text
  	</Button>));

  	expect(element.find('button').contains("Children Text")).toEqual(true);
  });

});

describe('Table', () => {

	const onDismiss = () => alert();

  const props = { list: [
      { title: '1', author: '1', num_comments: 1, points: 2, objectID: 'y' },
      { title: '2', author: '2', num_comments: 1, points: 2, objectID: 'z' },
    ],
    sortKey: 'TITLE',
    isSortReverse: false,
    onDismiss: onDismiss
  };

  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<Table { ...props } />, div);
  });

  test('has a valid snapshot', () => {
    const component = renderer.create(
      <Table { ...props } />
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('shows two items in list', () => {
  	const element = shallow(<Table {...props} />);

  	expect(element.find('.table-row').length).toBe(2);
  });

});

describe('updateSearchTopStoriesState', () => {

});

// const updateSearchTopStoriesState = (hits, page) => (prevState) => {
//   const { searchKey, results } = prevState;

//   const oldHits = results && results[searchKey]
//     ? results[searchKey].hits
//     : [];

//   const updatedHits = [
//     ...oldHits,
//     ...hits
//   ];

//   return {
//     results: {
//       ...results,
//       [searchKey]: { hits: updatedHits, page }
//     },
//     isLoading: false
//   };
// };
