# User Schema - Quick Reference

Quick lookup guide for the Mongoose User schema with bcrypt password hashing.

## Schema Definition

```javascript
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/valid-email-regex/, 'Invalid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false  // Hidden by default
  },
  role: {
    type: String,
    enum: ['creator', 'respondent', 'admin'],
    default: 'creator'
  }
}, { timestamps: true });
```

## Fields

| Field | Type | Required | Unique | Default | Notes |
|-------|------|----------|--------|---------|-------|
| name | String | ✅ | ❌ | - | 2-100 chars, auto-trimmed |
| email | String | ✅ | ✅ | - | Lowercase, auto-trimmed |
| password | String | ✅ | ❌ | - | Hashed, hidden by default |
| role | String | ❌ | ❌ | creator | creator, respondent, admin |
| createdAt | Date | ✅ | ❌ | now | Auto-generated |
| updatedAt | Date | ✅ | ❌ | now | Auto-generated |

## Methods

### Instance Methods

```javascript
// Compare password (returns Promise<boolean>)
await user.comparePassword(plainPassword);

// Get public data (returns Object without password)
user.toJSON();
```

### Static Methods

```javascript
// Find by email (case-insensitive)
User.findByEmail('john@example.com');

// Create new user (with validation)
User.createUser({ name, email, password });
```

## API Endpoints

### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure123"
}

Response: 201 Created
{
  "user": { id, name, email, role, createdAt },
  "token": "jwt_token"
}
```

### Login
```
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "secure123"
}

Response: 200 OK
{
  "user": { id, name, email, role, createdAt },
  "token": "jwt_token"
}
```

### Get Profile
```
GET /api/auth/profile
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "...",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "creator",
  "createdAt": "2024-02-09T...",
  "updatedAt": "2024-02-09T..."
}
```

### Update Profile
```
PUT /api/auth/profile
Authorization: Bearer <token>

{
  "name": "John Updated"
}

Response: 200 OK
{ updated user data }
```

### Change Password
```
POST /api/auth/change-password
Authorization: Bearer <token>

{
  "currentPassword": "oldPass123",
  "newPassword": "newPass123"
}

Response: 200 OK
{ "message": "Password changed successfully" }
```

## Usage Examples

### Create User
```javascript
// Method 1: Direct
const user = new User({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'myPass123'
});
await user.save();

// Method 2: Static method
const user = await User.createUser({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'myPass123'
});
```

### Login
```javascript
const user = await User.findOne({ email }).select('+password');
const isValid = await user.comparePassword(enteredPassword);

if (isValid) {
  const token = generateToken(user._id, user.email, user.role);
  res.json({ user: user.toJSON(), token });
}
```

### Update Name
```javascript
const user = await User.findByIdAndUpdate(
  userId,
  { name: 'New Name' },
  { new: true, runValidators: true }
);
```

### Change Password
```javascript
const user = await User.findById(userId).select('+password');

// Verify old password
const isValid = await user.comparePassword(currentPassword);

if (isValid) {
  user.password = newPassword;  // Will be hashed automatically
  await user.save();
}
```

## Validation

### Name
- ✅ "John Doe" (valid)
- ✅ "Jo" (minimum 2 chars)
- ❌ "J" (too short)
- ❌ "" (empty)

### Email
- ✅ "john@example.com" (valid)
- ✅ "JOHN@EXAMPLE.COM" (converted to lowercase)
- ❌ "invalidemail" (no @)
- ❌ "john@" (incomplete)

### Password
- ✅ "securePass123" (valid)
- ✅ "abc123" (minimum 6 chars)
- ❌ "12345" (too short)
- ❌ "" (empty)

### Role
- ✅ "creator" (default)
- ✅ "respondent"
- ✅ "admin"
- ❌ "user" (invalid)
- ❌ "manager" (invalid)

## Security

**Password Hashing:**
- Algorithm: bcrypt
- Salt rounds: 10
- Automatic: hashed on save/update
- Safe comparison: use comparePassword()

**Hidden Password:**
```javascript
// Password NOT included
const user = await User.findById(id);

// Password included (for login)
const user = await User.findById(id).select('+password');
```

**Unique Email:**
- Enforced at database level
- Case-insensitive
- Error: "Email already registered"

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Email already registered | Duplicate email | Use different email |
| Invalid email | Wrong format | Check email format |
| Password too short | < 6 chars | Use 6+ characters |
| Invalid role | Wrong role | Use creator/respondent/admin |
| User not found | ID doesn't exist | Check user ID |
| Invalid credentials | Wrong password | Check password |

## Testing

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"pass123"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"pass123"}'
```

### Get Profile
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/auth/profile
```

## Schema Changes from Original

| Original | Updated | Reason |
|----------|---------|--------|
| firstName, lastName | name | Simpler, single field |
| role: admin/user | role: creator/respondent/admin | Better reflects roles |
| Extra fields (company, phone, avatar) | Removed | Simplified schema |
| No index on createdAt | Added index | Better performance |

## Database

**Indexes:**
```javascript
// Email lookup: Fast
userSchema.index({ email: 1 });

// Date sorting: Fast
userSchema.index({ createdAt: -1 });
```

**Storage:**
- Passwords: Hashed, ~60 characters
- Email: Lowercased, indexed
- Timestamps: ISO 8601 format
- Role: String from enum

## Files Involved

- `src/models/User.js` - Schema definition
- `src/controllers/authController.js` - Auth logic
- `src/routes/auth.js` - API endpoints
- `src/middleware/auth.js` - JWT verification
- `src/utils/jwt.js` - Token generation

---

**Last Updated:** 2024-02-09
**Status:** Production Ready ✅
