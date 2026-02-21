# Mongoose User Schema Documentation

Complete guide to the User schema with bcrypt password hashing for the Survey Management SaaS application.

## Table of Contents
1. [Schema Overview](#schema-overview)
2. [Field Specifications](#field-specifications)
3. [Password Hashing](#password-hashing)
4. [Methods and Static Functions](#methods-and-static-functions)
5. [Usage Examples](#usage-examples)
6. [API Endpoints](#api-endpoints)
7. [Database Indexes](#database-indexes)
8. [Validation Rules](#validation-rules)
9. [Security Features](#security-features)

---

## Schema Overview

The User schema represents a user in the Survey Management SaaS system. Each user can create surveys, respond to surveys, and manage their account.

**File Location:** `backend/src/models/User.js`

**Key Features:**
- ✅ Bcrypt password hashing (10 salt rounds)
- ✅ Email uniqueness validation
- ✅ Role-based access control (3 roles: creator, respondent, admin)
- ✅ Automatic timestamps (createdAt, updatedAt)
- ✅ Database indexes for performance
- ✅ Instance and static methods for common operations

---

## Field Specifications

### name
- **Type:** String
- **Required:** Yes
- **Validation:**
  - Minimum 2 characters
  - Maximum 100 characters
  - Automatically trimmed
- **Example:** "John Doe", "Jane Smith"

```javascript
{
  name: "John Doe" // ✅ Valid
}

{
  name: "J" // ❌ Too short
}
```

### email
- **Type:** String
- **Required:** Yes
- **Unique:** Yes (enforced at database level)
- **Validation:**
  - Valid email format (regex match)
  - Automatically lowercased
  - Automatically trimmed
- **Error Message:** "Email already registered"
- **Example:** "john@example.com", "jane.doe@company.com"

```javascript
{
  email: "john@example.com" // ✅ Valid
}

{
  email: "invalid-email" // ❌ Invalid format
}

{
  email: "JOHN@EXAMPLE.COM" // ✅ Valid (converted to lowercase)
}
```

### password
- **Type:** String
- **Required:** Yes
- **Validation:**
  - Minimum 6 characters
  - Hashed before saving using bcrypt
  - **Not returned in queries by default** (select: false)
- **Hashing:**
  - Algorithm: bcrypt
  - Salt rounds: 10
  - Automatically hashed on save
  - Automatically hashed on password change
- **Example:** "securePassword123" (before hashing)

```javascript
// When saving
user.password = "myPassword123";
await user.save();
// Password is automatically hashed via pre-save middleware

// Password is hashed and stored
user.password; // '$2a$10$...' (hashed)
```

### role
- **Type:** String
- **Default:** "creator"
- **Valid Values:** "creator", "respondent", "admin"
- **Validation:** Must be one of the enum values
- **Error Message:** "Role must be one of: creator, respondent, admin"

**Role Descriptions:**
- **creator**: User who creates and publishes surveys
- **respondent**: User who responds to surveys
- **admin**: Administrator with full system access

```javascript
{
  role: "creator" // ✅ Default role
}

{
  role: "admin" // ✅ Admin role
}

{
  role: "invalid" // ❌ Invalid role
}
```

### createdAt
- **Type:** Date (Automatically generated)
- **Format:** ISO 8601 (UTC)
- **Set By:** Mongoose timestamps option
- **Example:** "2024-02-09T10:30:00.000Z"

```javascript
user.createdAt; // 2024-02-09T10:30:00.000Z
```

### updatedAt
- **Type:** Date (Automatically generated)
- **Format:** ISO 8601 (UTC)
- **Set By:** Mongoose timestamps option
- **Updated:** Whenever user document is modified
- **Example:** "2024-02-09T11:45:00.000Z"

```javascript
user.updatedAt; // 2024-02-09T11:45:00.000Z
```

---

## Password Hashing

### How It Works

The User schema uses bcrypt for password hashing with a pre-save middleware:

```javascript
userSchema.pre('save', async function (next) {
  // Only hash if password is new or modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});
```

**Process:**
1. Check if password is modified
2. Generate salt (10 rounds)
3. Hash password with salt
4. Replace plain password with hash
5. Save to database

**Security Features:**
- ✅ Passwords never stored in plain text
- ✅ Salt rounds: 10 (strong security)
- ✅ Automatic hashing on create and update
- ✅ Safe comparison method provided

### Salt Rounds Explanation

Salt rounds determine the computational cost:

| Rounds | Time | Use Case |
|--------|------|----------|
| 8 | ~40ms | Development |
| 10 | ~100ms | Default (current) |
| 12 | ~300ms | High security |
| 15 | ~1s | Maximum security |

Higher rounds = More secure but slower.

---

## Methods and Static Functions

### Instance Methods

#### comparePassword(enteredPassword)

Compares provided password with stored hash using bcrypt.

**Parameters:**
- `enteredPassword` (string): Password provided by user

**Returns:** Promise<boolean>

**Throws:** Error if password is missing

**Usage:**
```javascript
const user = await User.findById(userId).select('+password');
const isValid = await user.comparePassword('userPassword');

if (isValid) {
  // Password matches
} else {
  // Password incorrect
}
```

**Example in Login:**
```javascript
exports.login = async (req, res) => {
  const user = await User.findOne({ email }).select('+password');
  const isPasswordValid = await user.comparePassword(req.body.password);

  if (isPasswordValid) {
    // Generate token and return user
  } else {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
};
```

#### toJSON()

Returns user data without sensitive information.

**Returns:** Object (without password)

**Usage:**
```javascript
const user = await User.findById(userId);
const publicUser = user.toJSON();
// password field is removed
```

### Static Methods

#### User.findByEmail(email)

Finds user by email (case-insensitive).

**Parameters:**
- `email` (string): User's email address

**Returns:** Promise<User|null>

**Usage:**
```javascript
const user = await User.findByEmail('john@example.com');
if (user) {
  console.log('User found:', user.name);
} else {
  console.log('User not found');
}
```

#### User.createUser(userData)

Creates and saves a new user with validation.

**Parameters:**
- `userData` (object):
  - `name` (required): User's full name
  - `email` (required): User's email
  - `password` (required): User's password

**Returns:** Promise<User>

**Throws:** Error if validation fails or email exists

**Usage:**
```javascript
try {
  const user = await User.createUser({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'securePass123'
  });
  console.log('User created:', user._id);
} catch (error) {
  console.error('Error creating user:', error.message);
}
```

---

## Usage Examples

### Creating a New User

**Method 1: Direct instantiation**
```javascript
const user = new User({
  name: 'Jane Smith',
  email: 'jane@example.com',
  password: 'myPassword123'
});

await user.save();
// Password is automatically hashed before saving
```

**Method 2: Using createUser static method**
```javascript
const user = await User.createUser({
  name: 'Jane Smith',
  email: 'jane@example.com',
  password: 'myPassword123'
});
```

### Finding a User

```javascript
// By ID
const user = await User.findById(userId);

// By email
const user = await User.findByEmail('john@example.com');

// By email (case-insensitive, explicit)
const user = await User.findOne({ email: email.toLowerCase() });

// With password field (for login)
const user = await User.findOne({ email }).select('+password');
```

### Authenticating a User

```javascript
// 1. Find user by email and include password
const user = await User.findOne({ email: 'john@example.com' }).select('+password');

// 2. Compare provided password with stored hash
const isPasswordValid = await user.comparePassword(enteredPassword);

if (isPasswordValid) {
  // Authentication successful
  const token = generateToken(user._id, user.email, user.role);
  res.json({ user, token });
} else {
  // Authentication failed
  res.status(401).json({ message: 'Invalid credentials' });
}
```

### Updating User Profile

```javascript
// Update name
const user = await User.findByIdAndUpdate(
  userId,
  { name: 'John Updated' },
  { new: true, runValidators: true }
);

console.log(user.name); // 'John Updated'
```

### Changing Password

```javascript
// 1. Get user with password field
const user = await User.findById(userId).select('+password');

// 2. Verify current password
const isCurrentPasswordValid = await user.comparePassword(currentPassword);

if (!isCurrentPasswordValid) {
  throw new Error('Current password is incorrect');
}

// 3. Update password (automatically hashed on save)
user.password = newPassword;
await user.save();

console.log('Password changed successfully');
```

### Getting User Public Data

```javascript
const user = await User.findById(userId);

// Method 1: Using toJSON
const publicData = user.toJSON();
// { _id, name, email, role, createdAt, updatedAt }

// Method 2: Selecting fields
const publicData = await User.findById(userId).select('-password');
```

---

## API Endpoints

### Register (Create User)

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (Success 201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "creator",
      "createdAt": "2024-02-09T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (Error 400):**
```json
{
  "success": false,
  "message": "Email already registered",
  "status": 400
}
```

### Login (Authenticate User)

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "creator",
      "createdAt": "2024-02-09T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (Error 401):**
```json
{
  "success": false,
  "message": "Invalid credentials",
  "status": 401
}
```

### Get Profile (Protected)

**Endpoint:** `GET /api/auth/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Success 200):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "creator",
    "createdAt": "2024-02-09T10:30:00.000Z",
    "updatedAt": "2024-02-09T10:30:00.000Z"
  }
}
```

### Update Profile (Protected)

**Endpoint:** `PUT /api/auth/profile`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Updated"
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Updated",
    "email": "john@example.com",
    "role": "creator",
    "createdAt": "2024-02-09T10:30:00.000Z",
    "updatedAt": "2024-02-09T11:45:00.000Z"
  }
}
```

### Change Password (Protected)

**Endpoint:** `POST /api/auth/change-password`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123"
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Response (Error 401):**
```json
{
  "success": false,
  "message": "Current password is incorrect",
  "status": 401
}
```

---

## Database Indexes

Indexes improve query performance:

```javascript
// Index on email for faster lookups
userSchema.index({ email: 1 });

// Index on createdAt for sorting by date
userSchema.index({ createdAt: -1 });
```

**Performance Impact:**
- Email lookup: O(1) instead of O(n)
- Date sorting: Much faster for large datasets
- Unique constraint on email: Automatically indexed

---

## Validation Rules

### Name Validation

```javascript
name: {
  required: [true, 'Please provide a name'],
  trim: true,
  minlength: [2, 'Name must be at least 2 characters long'],
  maxlength: [100, 'Name cannot exceed 100 characters']
}
```

**Valid Examples:**
- ✅ "John Doe"
- ✅ "Jane Smith"
- ✅ "Jo" (minimum)

**Invalid Examples:**
- ❌ "J" (too short)
- ❌ "" (empty)
- ❌ "J".repeat(101) (too long)

### Email Validation

```javascript
email: {
  required: [true, 'Please provide an email'],
  unique: [true, 'Email already registered'],
  lowercase: true,
  trim: true,
  match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
}
```

**Valid Examples:**
- ✅ "john@example.com"
- ✅ "jane.doe@company.co.uk"
- ✅ "JOHN@EXAMPLE.COM" (converted to lowercase)

**Invalid Examples:**
- ❌ "invalidemail"
- ❌ "john@"
- ❌ "@example.com"

### Password Validation

```javascript
password: {
  required: [true, 'Please provide a password'],
  minlength: [6, 'Password must be at least 6 characters long'],
  select: false
}
```

**Valid Examples:**
- ✅ "myPass123"
- ✅ "securePassword"

**Invalid Examples:**
- ❌ "12345" (too short)
- ❌ "" (empty)

### Role Validation

```javascript
role: {
  type: String,
  enum: {
    values: ['creator', 'respondent', 'admin'],
    message: 'Role must be one of: creator, respondent, admin'
  },
  default: 'creator'
}
```

**Valid Values:**
- ✅ "creator" (default)
- ✅ "respondent"
- ✅ "admin"

**Invalid Values:**
- ❌ "user"
- ❌ "manager"
- ❌ "superuser"

---

## Security Features

### Password Security

1. **Bcrypt Hashing**
   - 10 salt rounds
   - Automatically applied on save
   - Passwords never stored in plain text

2. **Password Comparison**
   - Safe comparison using bcrypt.compare
   - Prevents timing attacks
   - Returns boolean (true/false)

3. **Password Field Hidden**
   - Password excluded from queries by default (select: false)
   - Must explicitly select('+password') for login
   - Never returned in API responses

### Data Protection

1. **Email Uniqueness**
   - Enforced at database level
   - Case-insensitive
   - Prevents duplicate accounts

2. **Input Validation**
   - All fields validated
   - Custom error messages
   - Type checking

3. **Sensitive Data Removal**
   - toJSON() removes password
   - API responses exclude password
   - Tokens used instead of passwords

### Best Practices

```javascript
// ✅ Good: Using comparePassword for authentication
const isValid = await user.comparePassword(enteredPassword);

// ❌ Bad: Direct comparison
if (user.password === enteredPassword) { } // Never!

// ✅ Good: Password excluded by default
const user = await User.findById(userId);
// password field is not included

// ✅ Good: Explicitly include password for comparison
const user = await User.findById(userId).select('+password');

// ❌ Bad: Exposing password in responses
res.json(user); // Would include hashed password

// ✅ Good: Use toJSON or select
res.json(user.toJSON()); // Password removed
```

---

## Error Handling

### Common Errors

**Email Already Registered:**
```json
{
  "message": "Email already registered",
  "status": 400,
  "code": 11000 // MongoDB duplicate key error
}
```

**Invalid Email Format:**
```json
{
  "message": "Please provide a valid email address",
  "status": 400
}
```

**Password Too Short:**
```json
{
  "message": "Password must be at least 6 characters long",
  "status": 400
}
```

**Invalid Role:**
```json
{
  "message": "Role must be one of: creator, respondent, admin",
  "status": 400
}
```

---

## Testing the User Schema

### Test Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securePass123"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePass123"
  }'
```

### Test Get Profile
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/auth/profile
```

---

## Summary

The User schema provides:

✅ Secure password hashing with bcrypt
✅ Automatic validation of all fields
✅ Role-based user types
✅ Timestamps for audit trail
✅ Database indexes for performance
✅ Instance methods for common operations
✅ Static methods for query helpers
✅ Comprehensive error messages

**Ready for production with enterprise-grade security!**
