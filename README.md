# Migration Guide: Device-Only Authentication System

## Overview

Sistem ini telah diupdate untuk menggunakan device-only authentication dimana:
- Device ID hanya tersimpan di aplikasi Electron, tidak di database
- Database menyimpan hash dari device credentials untuk verifikasi
- Setiap device hanya bisa memiliki satu akun aktif
- User tidak bisa login dari device yang berbeda secara bersamaan

## Perubahan Utama

### 1. Database Schema Changes
- Menghapus `deviceId` dari tabel `User`
- Menambah kolom `isActive` ke tabel `User`
- Mengubah `deviceId` menjadi `deviceHash` di tabel `Token`

### 2. Electron Main Process
- Generate dan simpan device credentials secara lokal
- Device ID dan secret tersimpan di file encrypted di userData folder
- Validation hardware fingerprint untuk deteksi perubahan hardware

### 3. Authentication Flow
- Client generate device hash menggunakan device credentials
- Server verifikasi hash tanpa menyimpan device ID asli
- Setiap login invalidate semua token lama dari device lain

## Migration Steps

### Step 1: Update Database Schema

```bash
# Generate new migration
npm run db:migrate

# Atau jalankan manual SQL migration script
# Lihat file migration_script.sql
```

### Step 2: Update Environment Variables

Tambahkan variable baru ke `.env`:

```bash
# Device Authentication Security
DEVICE_SALT=your-device-security-salt-for-additional-protection
```

### Step 3: Update Dependencies

```bash
# Install ulang dependencies jika diperlukan
npm install

# Generate Prisma client dengan schema baru
npm run db:generate
```

### Step 4: Clear Existing Sessions (Recommended)

```sql
-- Optional: Clear semua token existing untuk memaksa re-authentication
DELETE FROM Token;
```

### Step 5: Test Migration

1. Start backend server
2. Start Electron app
3. Test registration dengan device baru
4. Test login dari device yang sama
5. Test device restriction (coba login dari device/browser lain)

## New API Endpoints

### Force Logout from Other Devices
```
POST /api/auth/logout-other-devices
Headers: Authorization: Bearer <token>
Body: { "deviceHash": "device-hash-here" }
```

### Get Active Sessions
```
GET /api/auth/sessions
Headers: Authorization: Bearer <token>
```

### Health Check
```
GET /api/auth/health
```

## Security Features

### Device Credentials
- Device ID: SHA256 hash dari hardware information
- Device Secret: Random 32-byte hex string yang bisa di-rotate
- Hardware Fingerprint: MD5 hash untuk validasi integritas device

### Authentication Process
1. Electron app generate device hash dari credentials + username
2. Server verify hash dan check device conflicts
3. Server issue JWT token dengan device hash binding
4. Subsequent requests validate token + device hash

### Device Restriction
- Satu akun hanya aktif di satu device
- Login dari device berbeda akan gagal dengan error
- User bisa force logout dari device lain
- Device change memerlukan re-authentication

## Troubleshooting

### "Device authentication failed"
- Restart aplikasi Electron
- Check file permissions di userData folder
- Clear device credentials: delete `.device_credentials` file

### "Account already active on another device"
- Gunakan force logout feature
- Atau logout manual dari device lain terlebih dahulu

### "This device is already registered to another account"
- Setiap device hanya bisa punya satu akun
- Gunakan account yang sudah terdaftar di device tersebut
- Atau clear device credentials untuk reset

### Database Migration Issues
- Backup database sebelum migration
- Check foreign key constraints
- Run migration script step by step

## Development Notes

### Debugging Device System
```javascript
// Di browser console Electron
debugAuth(); // Check authentication state
debugRegistration(); // Check registration state
```

### Clear Device Credentials (Development)
```javascript
// Di browser console Electron
await clearDeviceCredentials();
```

### Rotate Device Secret
```javascript
// Di browser console Electron
await rotateDeviceSecret();
```

## Production Deployment

1. **Backup Database**: Selalu backup sebelum migration
2. **Update Environment**: Set `DEVICE_SALT` dengan nilai yang secure
3. **Run Migration**: Jalankan migration script di production
4. **Clear Sessions**: Optional clear semua token untuk memaksa re-auth
5. **Monitor Logs**: Watch untuk device authentication errors
6. **User Communication**: Inform users tentang perubahan authentication

## Security Considerations

- Device credentials file di-encrypt di userData folder
- Server tidak pernah menyimpan device ID asli
- Device hash menggunakan server-side salt untuk additional security
- Hardware fingerprint validation mencegah device credential transfer
- Token expiration dan validation mencegah session hijacking

## Files Modified

### Backend
- `prisma/schema.prisma` - Updated schema
- `src/services/authService.js` - Device hash logic
- `src/controllers/authController.js` - New endpoints
- `src/routes/authRoutes.js` - Updated routes
- `src/utils/validators.js` - Device hash validation

### Frontend
- `main.js` - Device credential management
- `frontend/js/device.js` - Device system integration
- `frontend/js/auth.js` - Updated authentication flow
- `frontend/js/register.js` - Updated registration flow

### New Files
- Migration script untuk database update
- Environment variables template
