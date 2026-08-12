import { config } from '../config.js';

export const signup = async (req, res) => {
  try {
    const { email, password, fullname } = req.body;

    if (!email || !password || !fullname) {
      return res.status(400).json({ error: 'Email, password, and fullname are required' });
    }

    const response = await fetch(`${config.authUrl}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        data: {
          fullname,
          role: 'individual'
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Signup Error:', error.message);
    res.status(500).json({ error: 'Internal server error during signup' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const response = await fetch(`${config.authUrl}/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ error: 'Internal server error during login' });
  }
};

export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(400).json({ error: 'No authorization header provided' });
    }

    const response = await fetch(`${config.authUrl}/logout`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const data = await response.json();
      return res.status(response.status).json(data);
    }

    res.status(204).send();
  } catch (error) {
    console.error('Logout Error:', error.message);
    res.status(500).json({ error: 'Internal server error during logout' });
  }
};

export const refresh = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const response = await fetch(`${config.authUrl}/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Refresh Error:', error.message);
    res.status(500).json({ error: 'Internal server error during token refresh' });
  }
};

export const me = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    // Proxy the request to GoTrue's /user endpoint to get the exact same user object
    const response = await fetch(`${config.authUrl}/user`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(200).json({ user: data });
  } catch (error) {
    console.error('Me Error:', error.message);
    res.status(500).json({ error: 'Internal server error during user fetch' });
  }
};


export const changePassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: 'New password is required'
      });
    }

    const response = await fetch(`${config.authUrl}/user`, {
      method: 'PUT',
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Change Password Error:', error.message);

    res.status(500).json({
      error: 'Internal server error during password change'
    });
  }
};


export const changeName = async (req, res) => {
  try {
    const { fullname } = req.body;

    if (!fullname) {
      return res.status(400).json({
        error: 'Full name is required'
      });
    }

    const response = await fetch(`${config.authUrl}/user`, {
      method: 'PUT',
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          fullname
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Change Name Error:', error.message);

    res.status(500).json({
      error: 'Internal server error during name change'
    });
  }
};
