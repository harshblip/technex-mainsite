import { Component, OnInit } from '@angular/core';
import * as firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import { ApiService } from "../services/api.service";
import { Login } from "../utilities/login";
import { Register } from "../utilities/register";
import { CookieService } from 'ngx-cookie-service';

declare interface RouteInfo {
  path: string;
  title: string;
  class: string;
}

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})

export class AuthComponent implements OnInit {
  menuItems: any[];
  teammenuItems: any[];
  headoutmenuItems: any[];
  is_login = true;
  loginModel = new Login('');
  register_email = '';
  register_firstname = '';
  register_lastname = '';
  register_password1 = '';
  register_password2 = '';
  register_college = '';
  register_city = '';
  register_phone = '';
  register_gender = 0;
  register_year = 1;
  register_button_tag = "Register";

  loginform = false;
  login_email = '';
  login_password = '';
  isLoggedIn: string;
  isLoggedInBool: boolean;
  login_button_tag = "Login";

  isMessageLogin = false;
  msg_login = '';
  isMessageRegister = false;
  msg_register = '';

  constructor(
    private _apiService: ApiService,
    private cookieService: CookieService) {
      this.isLoggedIn = this.cookieService.get('logged');
      if (this.isLoggedIn === 'true') {
        this.isLoggedInBool = true;
      } else {
        this.isLoggedInBool = false;
      }
    }

  ngOnInit() {
    const firebaseConfig = {
      apiKey: "AIzaSyBPlZ_NSEcmD9ZjwcdroTzpSTFXOAvRbkM",
      authDomain: "auth.technex.co.in",
      databaseURL: "https://technex2020.firebaseio.com",
      projectId: "technex2020",
      storageBucket: "technex2020.appspot.com",
      messagingSenderId: "267724660104",
      appId: "1:267724660104:web:720bddd5e1599a00602e3d",
      measurementId: "G-BPPJCTCVT6"
    };
    firebase.initializeApp(firebaseConfig);
    // Popup
    document.getElementById('load-popup').classList.add('load-popup-show');
  }

  closeLoadPopup() {
    document.getElementById('load-popup').classList.remove('load-popup-show');
  }

  toggle_is_login() {
    this.is_login = !this.is_login;
  }

  togglelogin() {
    this.loginform = !this.loginform;
  }

  firebase_resend_verification_email() {
    firebase.auth().signOut().then(function() {
    }).catch(function(error) {
      console.log(error);
    });
    if (this.loginValidate()) {
      var self = this;
      firebase.auth().signInWithEmailAndPassword(
        this.login_email, this.login_password).catch(
          (error) => {
            console.log(error);
            self.isMessageLogin = true;
            self.msg_login = 'Invalid Credentials!!';
            self.login_button_tag = "Login";
            if (error.code == "auth/too-many-requests") {
              self.msg_login = error.message;
              self.login_button_tag = "Login";
            }
        });
      firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
          var user = firebase.auth().currentUser;
          console.log(user);
          if(user != null){
            user.sendEmailVerification().then(function() {
              self.msg_login = 'Verification Email has been resent to your email address.';
              self.login_button_tag = "Login";
            }).catch(function(error) {
              console.log(error);
            });
          }
          else {
            self.isMessageLogin = true;
            self.msg_login = 'Invalid credentials!';
            self.login_button_tag = "Login";
          }
        }
      })
    }
  }

  firebase_reset_password() {
    firebase.auth().signOut().then(function() {
    }).catch(function(error) {
      console.log(error);
    });
    var self = this;
    firebase.auth().sendPasswordResetEmail(this.login_email).then(function() {
      self.msg_login = 'Password Reset email has been sent to your email address.';
      self.login_button_tag = "Login";
    }).catch(function(error) {
      if (error.message) {
        self.msg_login = error.message;
        self.login_button_tag = "Login";
      }
      console.log(error);
    });
  }

  login_user() {
    var api_error = null;
    this._apiService.login(this.loginModel).subscribe(
      data => {
        this.cookieService.set('login_token', data.message, 200, undefined, '.technex.co.in');
        this.cookieService.set('logged', 'true', 200, undefined, '.technex.co.in');
        this.isMessageLogin = true;
        this.msg_login = 'Login Successful. You will be redirected to your dashboard'; 
        this.login_button_tag = "Redirecting...";
        window.location.href = 'https://dashboard.technex.co.in/';
      },
      error => {
        console.log(error);
        api_error = error;
        try {
          if (api_error.error.non_field_errors[0] == "No such account exists") {
            this.isMessageLogin = true;
            this.msg_login = 'No such account exists. Please register!'; 
            this.login_button_tag = "Login";
          }
          else if (api_error.error.non_field_errors[0] == "Email is not verified") {
            this.isMessageLogin = true;
            this.msg_login = 'Email is not verified!';
            this.login_button_tag = "Login";
          }
        } catch(err) {
          this.isMessageLogin = true;
          this.msg_login = 'Please fill all the fields correctly';
          this.login_button_tag = "Login";
        }
      }
    );
  }

  firebase_password_register() {
    var api_error = null;
    this.isMessageRegister = false;
    this.msg_register = '';
    firebase.auth().createUserWithEmailAndPassword(this.register_email, this.register_password1).catch(function(error) {
      this.isMessageRegister = true;
      this.msg_register = 'You are already registered';
      this.register_button_tag = "Register";
    }.bind(this));
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        var id_token = null;
        id_token = user.toJSON();  
        id_token = id_token.stsTokenManager.accessToken;
        this.loginModel.id_token = id_token;
        const registerModel = new Register(
          this.loginModel.id_token,
          this.register_firstname,
          this.register_lastname,
          Number(this.register_gender),
          Number(this.register_year),
          this.register_phone,
          this.register_college,
          this.register_city);
        this._apiService.register(registerModel).subscribe(
          data => {
            user.sendEmailVerification().then(function() {}).catch(function(error){console.log(error);});
            this.isMessageRegister = true;
            this.msg_register = 'Successfully registered! Please verify your email by clicking on the link sent to your email address.';
            this.register_button_tag = "Registered!!";
            this.register_email = '';
            this.register_firstname = '';
            this.register_lastname = '';
            this.register_password1 = '';
            this.register_password2 = '';
            this.register_college = '';
            this.register_city = '';
            this.register_phone = '';
            this.register_gender = 0;
            this.register_year = 1;
          },
          error => {
            console.log(error);
            api_error = error;
            try {
              if (api_error.error[0] == "User already exists") {
                this.isMessageRegister = true;
                this.msg_register = 'You are already registered';
                this.register_button_tag = "Register";
              }
            } catch(err) {
              this.isMessageRegister = true;
              this.msg_register = 'Please fill all the fields correctly';
              this.register_button_tag = "Register";
            }
          }
        )
      }
    }.bind(this)
    );
    firebase.auth().signOut().then(function() {
    }).catch(function(error) {
      console.log(error);
    });
    
  }

  register_password() {
    var api_error = null;
    this.firebase_password_register();
  }

  password_login() {
    this.login_button_tag = 'Please Wait...';
    firebase.auth().signOut().then(function() {
    }).catch(function(error) {
      console.log(error);
    });
    if (this.loginValidate()) {
      var self = this;
      firebase.auth().signInWithEmailAndPassword(
        this.login_email, this.login_password).catch(
          (error) => {
            console.log(error);
            self.isMessageLogin = true;
            self.msg_login = 'Invalid Credentials!!';
            self.login_button_tag = "Login";
            if (error.code == "auth/too-many-requests") {
              self.msg_login = error.message;
              self.login_button_tag = "Login";
            }
        });
      firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
          var user = firebase.auth().currentUser;
          console.log(user);
          if(user != null){
            let id_token = null;
            id_token = user.toJSON();
            id_token = id_token.stsTokenManager.accessToken;
            self.loginModel.id_token = id_token;
            self.login_user();
          }
          else {
            self.isMessageLogin = true;
            self.msg_login = 'Invalid credentials!';
            self.login_button_tag = "Login";
          }
        }
      })
    }
  }

  emailValidate(email) {
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return true;
    }
    return false;
  }

  loginValidate() {
    if (this.login_email === '' || this.login_password === '') {
      this.isMessageLogin = true;
      this.msg_login = 'Please fill all the fields';
      this.login_button_tag = "Login";
      return false;
    }
    if (!this.emailValidate(this.login_email)) {
      this.isMessageLogin = true;
      this.msg_login = 'Please enter a valid email address';
      this.login_button_tag = "Login";
      return false;
    }
    return true;
  }

  registerValidate() {
    if (!this.emailValidate(this.register_email)) {
      this.isMessageRegister = true;
      this.msg_register = 'Please enter a valid email address';
      this.register_button_tag = "Register";
      return false;
    }
    if (this.register_password1.length < 6) {
      this.isMessageRegister = true;
      this.msg_register = 'Password should be atleast 6 characters long';
      this.register_button_tag = "Register";
      this.register_password1 = '';
      this.register_password2 = '';
      return false;
    }
    if (this.register_password1 !== this.register_password2) {
      this.isMessageRegister = true;
      this.msg_register = 'Passwords do not match!';
      this.register_button_tag = "Register";
      this.register_password1 = '';
      this.register_password2 = '';
      return false;
    }
    if (this.register_firstname == '') {
      this.isMessageRegister = true;
      this.msg_register = 'First Name is mandatory';
      this.register_button_tag = "Register";
      return false;
    }
    if (this.register_phone.length !== 10) {
      this.isMessageRegister = true;
      this.msg_register = 'Phone number should have 10 digits';
      this.register_button_tag = "Register";
      return false;
    }
    const isnum_phone = /^\d+$/.test(this.register_phone);
    if (!isnum_phone) {
      this.isMessageRegister = true;
      this.msg_register = 'Enter a valid phone number';
      this.register_button_tag = "Register";
      return false;
    }
    if (this.register_college == '') {
      this.isMessageRegister = true;
      this.msg_register = 'Please enter your college name';
      this.register_button_tag = "Register";
      return false;
    }
    if (this.register_city == '') {
      this.isMessageRegister = true;
      this.msg_register = 'Please enter your city name';
      this.register_button_tag = "Register";
      return false;
    }
    this.isMessageRegister = false;
    this.msg_register = '';
    this.register_button_tag = "Registering...";

    return true;
  }

  register() {
    this.register_button_tag = "Registering...";
    firebase.auth().signOut().then(function() {
    }).catch(function(error) {
      console.log(error);
    });
    if (this.registerValidate()) {
      this.register_password();
    }
  }
}
