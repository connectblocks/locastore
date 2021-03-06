import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Nav from './Nav.jsx';
import Search from './Search.jsx';
import ProductSearch from './ProductSearch.jsx';
import Business from './Business.jsx';
import Signup from './Signup.jsx';
import Login from './Login.jsx';
import About from './About.jsx';
import ProfileWithRouter from './Profile.jsx';
import SmallNav from './SmallNav.jsx';
import $ from 'jquery';
import '../styles/App.css';
import cookie from 'react-cookie'
import { withRouter } from 'react-router';
import {
  BrowserRouter as Router,
  Route,
  Link,
  Switch,
  Redirect
} from 'react-router-dom';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      stores: [],
      alertVisible: false,
      loading: false,
      imgLoading: false,
      loggedIn: false,
      location: ''
    }

    this.onDismiss = this.onDismiss.bind(this);
    this.search = this.search.bind(this);
    this.signupSubmit = this.signupSubmit.bind(this);
    this.loginSubmit = this.loginSubmit.bind(this);
    this.prodsearch = this.prodsearch.bind(this);
    this.retrieveDetail = this.retrieveDetail.bind(this);
    this.cacheBusiness = this.cacheBusiness.bind(this);
  }

  componentDidMount() {
    if (cookie.load('loggedIn') === 'true' && this.state.loggedIn === false) {
      this.setState({
        loggedIn: true
      });
    } else {
      this.setState({
        loggedIn: false
      });
    }
  }

  cacheBusiness() {
    let businesses = JSON.stringify(this.state.stores);
    let cached = sessionStorage.getItem('businesses');
    if (cached && !JSON.parse(businesses).length) {
      this.setState({
        stores: JSON.parse(cached)
      });
    } else {
      sessionStorage.setItem('businesses', businesses);
      this.setState({
        stores: JSON.parse(businesses)
      });
    }
  }

  componentWillMount() {
    this.cacheBusiness();
  }

  componentWillReceiveProps() {
    this.cacheBusiness();
  }

  onDismiss() {
    this.setState({ alertVisible: false });
  }

  search(location) {
    let city = location.split(',').splice(0,2).join(',');

    this.setState({
      location: city
    });

    axios.post('/postlocation', {
      text: `${location}`
    })
    .then(res => {
      if (res.status === 204) {
        console.log(`No results found for: ${location}`);
        this.setState({ alertVisible: true });
      } else {
        const stores = res.data;
        this.setState({stores});
        this.props.history.push('/location');
      }
    })
    .catch(err => {
      console.log(err);
    })
  }

  prodsearch(product) {
     if (!product) {
      this.setState({
        alertVisible: true
      });
      return;
    }
    let query;
    if  (product.length > 1) {
      query = product.join(' ');
    } else {
      query = product[0];
    }

    this.setState({
      loading: true
    });

    axios.post('/product', {
      text: `${query}`
    })
    .then(res => {
      if (res.status === 204) {
        console.log(`No results found for: ${product}`);
        this.setState({
          stores: [],
          loading: false,
          alertVisible: false
        });
      } else {
        const stores = res.data;
        this.setState({
          stores: stores,
          loading: false,
          alertVisible: false
        });
      }
    })
    .catch(err => {
      console.log(err);
    })
  }

  signupSubmit(signup) {
    let username = signup.username;
    let email = signup.email;
    let password = signup.password;
    axios.post('/signup', {
      username: `${username}`,
      email: `${email}`,
      password: `${password}`
    })
    .then(res => {
      this.props.history.push('/login');
    })
    .catch((err) => {
      alert(err);
    })
  }

  retrieveDetail(placeId) {
    this.setState({
      imgLoading: true
    });
    this.props.history.push(`/location/${placeId}`);

    axios.get('/business', {
      params: {
        id: placeId
      }
    })
    .then((res) => {
      for (let i = 0; i < this.state.stores.length; i++) {
        let store = this.state.stores[i];
        if (store.place_id === placeId) {
          store.hours = res.data.hours;
          store.extra_photos = res.data.photos;
          store.website = res.data.website;
          this.setState({
            imgLoading: false
          });

        }
      }
    })
    .catch((err) => {
      console.log(err);
    });
  }

  loginSubmit(login) {
    let username = login.username;
    let password = login.password;
    axios.post('/postlogin', {
      username: `${username}`,
      password: `${password}`
    })
    .then(res => {
      if (res.status === 200 ) {
        this.setState({
          loggedIn: true
        });
        this.props.history.push('/');
      };
    })
    .catch((err) => {
      console.log(err);
      alert('The username and/or password do match the records we have on file. Please check your spelling and try again.');
    })
  }

  handleLogout() {
    axios.get('/logout');
  }


  render() {
    return (
      <MuiThemeProvider>
      <div className="app">
        <Switch>
          <Route
            exact path="/"
            render={ () =>
              <div className="home">
                <div className="overlay">
                  <Nav loginStatus={this.state.loggedIn} logout={this.handleLogout}/>
                </div>
                <div className="searchcol">
                  <Search onSearch={this.search} alertVisible={this.state.alertVisible} onDismiss={this.onDismiss}/>
                </div>
              </div>
            }
          />

          <Route
            path="/signup"
            render={ () =>
              <Signup signupSubmit={this.signupSubmit}/>
            }
          />

          <Route
            path="/login"
            render={ () =>
              <Login loginSubmit={this.loginSubmit} />
            }
          />

          <Route
            exact path="/location"
            render={ () =>
              <ProductSearch
                onSearch={this.prodsearch}
                alertVisible={this.state.alertVisible}
                onDismiss={this.onDismiss}
                location={this.state.location}
              />
            }
          />

          <Route path="/location"
            handleDetail={this.retrieveDetail}
            businesses={this.state.stores}
            loading={this.state.loading}
            loginStatus={this.state.loggedIn}
            imgLoading={this.state.imgLoading}
          />

          <Route
            path='/about'
            component={About}
          />

          <Route
            path='/profile'
            render={ () =>
              <ProfileWithRouter
                loginStatus={this.state.loggedIn}
                handleDetail={this.retrieveDetail}
                loading={this.state.loading}
                imgLoading={this.state.imgLoading}
              />
            }
          />

          <Route
            path="/logout"
            render={ () => {
              this.handleLogout();
              return (
                <Redirect to="/login"/>
              )
            }}

          />

          <Redirect to="/"/>

        </Switch>

        <Business
          handleDetail={this.retrieveDetail}
          businesses={this.state.stores}
          loading={this.state.loading}
          loginStatus={this.state.loggedIn}
          imgLoading={this.state.imgLoading}
        />

      </div>
      </MuiThemeProvider>
    );
  }
}

const throttle = (func, limit) => {
  let lastFunc
  let lastRan
  return function() {
    const context = this
    const args = arguments
    if (!lastRan) {
      func.apply(context, args)
      lastRan = Date.now()
    } else {
      clearTimeout(lastFunc)
      lastFunc = setTimeout(function() {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(context, args)
          lastRan = Date.now()
        }
      }, limit - (Date.now() - lastRan))
    }
  }
}

const AppWithRouter = withRouter(App);

export default AppWithRouter;