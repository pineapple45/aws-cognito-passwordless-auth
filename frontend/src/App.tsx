import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Form, Spinner, Button, Container } from 'react-bootstrap';
import Input from './components/Input';
import PhoneNumberInput from 'react-phone-number-input/input';

import { Auth, Analytics, Amplify } from 'aws-amplify';
import Home from './components/home';
import config from './aws-amplify-config';

Amplify.configure(config);

const NOTSIGNIN = 'You are NOT logged in';
const SIGNEDIN = 'You have logged in successfully';
const SIGNEDOUT = 'You have logged out successfully';
const WAITINGFOROTP = 'Enter OTP number';
const VERIFYNUMBER = 'Verifying number (Country code +XX needed)';
const VERIFYEMAIL = 'Verifying email';

const App = () => {
  const [message, setMessage] = useState('Welcome to AWS Amplify Demo');
  const [user, setUser] = useState<string | null>(null);
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<number | null>(null);
  const [otp, setOtp] = useState<number | null>(null);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const password = Math.random().toString(10) + 'Abc#';

  const verifyAuth = () => {
    Auth.currentAuthenticatedUser()
      .then((user) => {
        setUser(user);
        setMessage(SIGNEDIN);
        setSession(null);
      })
      .catch((err) => {
        console.error(err);
        setMessage(NOTSIGNIN);
      });
  };

  const signOut = () => {
    if (user) {
      Auth.signOut();
      setUser(null);
      setOtp(null);
      setMessage(SIGNEDOUT);
    } else {
      setMessage(NOTSIGNIN);
    }
  };

  const signIn = () => {
    console.log('signin triggered');
    setMessage(VERIFYEMAIL);
    console.log(user, email, password);

    Auth.signIn(email!)
      .then((result) => {
        setSession(result);
        setMessage(WAITINGFOROTP);
      })
      .catch((e) => {
        if (e.code === 'UserNotFoundException') {
          signUp();
        } else if (e.code === 'UsernameExistsException') {
          setMessage(WAITINGFOROTP);
          signIn();
        } else {
          console.log(e.code);
          console.error(e);
        }
      });
  };

  const signUp = async () => {
    console.log('signup triggered');
    const result = await Auth.signUp({
      username: email as string,
      password,
      attributes: {
        email: email,
        phoneNumber: phoneNumber === null ? '' : phoneNumber,
        address: '',
      },
    }).then(() => signIn());
    return result;
  };

  const verifyOtp = () => {
    Auth.sendCustomChallengeAnswer(session, otp!.toString())
      .then((user) => {
        setUser(user);
        setMessage(SIGNEDIN);
        setSession(null);
      })
      .catch((err) => {
        signIn();
        setMessage(err.message);
        setOtp(null);
        console.log(err);
      });
  };
  const emailHandler = (email: string | null) => {
    setEmail(email);
  };

  const phoneNumberHandler = (number: number | null) => {
    setPhoneNumber(number);
  };

  const otpHandler = (otpRecieved: number | null) => {
    setOtp(otpRecieved);
  };

  const initiateOTPrequest = (e: React.FormEvent<HTMLFormElement>) => {
    // initiate OTP request here
    e.preventDefault();
    signIn();
    setShowOtpForm(true);
  };

  const initiateAuth = (e: React.FormEvent<HTMLFormElement>) => {
    // initiate login proess here
    e.preventDefault();
    // setOtp(null)
    verifyOtp();
    console.log(otp);
    setShowOtpForm(false);
  };

  useEffect(() => {
    console.log('Ready to auth');
    // Auth.currentCredentials();
    setTimeout(verifyAuth, 1500);
    Analytics.autoTrack('session', {
      enable: true,
    });
  }, []);

  useEffect(() => {
    console.log('current user is', user);
  }, [user]);

  useEffect(() => {
    console.log(email);
  }, [email]);

  if (!user) {
    return (
      <Container>
        {showOtpForm ? (
          <Form onSubmit={(e) => initiateAuth(e)}>
            <br />
            <Input
              controlId="otpInput"
              inputType="number"
              label="OTP"
              placeholder="Enter otp"
              inputCall={otpHandler}
            />
            <br />
            <p>OTP not received ? Resend OTP</p>
            <Button type="submit">LOGIN</Button>
          </Form>
        ) : (
          <Tabs defaultActiveKey="login-with-email">
            {/* sign up with email form */}
            <Tab eventKey="login-with-email" title="email">
              <Form onSubmit={(e) => initiateOTPrequest(e)}>
                <Input
                  controlId="loginFormEmail"
                  inputType="email"
                  label="Email address"
                  placeholder="Enter email"
                  inputCall={emailHandler}
                />

                <Button type="submit">GET OTP</Button>
              </Form>
            </Tab>
            {/* sign up with phone number form */}
            <Tab eventKey="login-with-phone-number" title="phone number">
              <Form onSubmit={(e) => initiateOTPrequest(e)}>
                <PhoneNumberInput
                  className="form-control"
                  country="IN"
                  international
                  withCountryCallingCode
                  value={phoneNumber}
                  onChange={phoneNumberHandler}
                />
                <Button type="submit">GET OTP</Button>
                <br />
              </Form>
            </Tab>
          </Tabs>
        )}
        <p>{message}</p>
      </Container>
    );
  } else {
    return <Home signOut={signOut} />;
  }
};

export default App;
