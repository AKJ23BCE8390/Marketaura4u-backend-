function logout(req, res) {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',        // or 'strict' – MUST match login
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  });

  return res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
}

module.exports = logout;
