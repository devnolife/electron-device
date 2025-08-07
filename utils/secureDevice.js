const { machineIdSync } = require('node-machine-id');
const crypto = require('crypto');
const Store = require('electron-store');
const os = require('os');
const fs = require('fs');
const path = require('path');

class SecureDeviceManager {
  constructor() {
    // Initialize encrypted store for device binding
    this.store = new Store({
      name: 'secure-device',
      encryptionKey: this.getEncryptionKey()
    });

    this.deviceBindingFile = path.join(process.env.APPDATA || process.env.HOME, '.device_binding');
  }

  /**
   * Generate encryption key based on hardware
   */
  getEncryptionKey() {
    try {
      const machineId = machineIdSync(true);
      const platform = process.platform;
      const arch = process.arch;

      return crypto
        .createHash('sha256')
        .update(`${machineId}-${platform}-${arch}-secure-device-key`)
        .digest('hex')
        .substring(0, 32);
    } catch (error) {
      console.warn('Could not generate hardware-based encryption key, using fallback');
      return 'fallback-encryption-key-32-chars';
    }
  }

  /**
   * Get hardware fingerprint from actual hardware components
   */
  getHardwareFingerprint() {
    try {
      const machineId = machineIdSync(true);
      const cpuInfo = os.cpus()[0]?.model || 'unknown';
      const platform = process.platform;
      const arch = process.arch;
      const hostname = os.hostname();
      const totalMemory = os.totalmem();

      // Get network interface MAC addresses (exclude virtual interfaces)
      const networkInterfaces = os.networkInterfaces();
      const macAddresses = Object.values(networkInterfaces)
        .flat()
        .filter(iface =>
          !iface.internal &&
          iface.mac &&
          iface.mac !== '00:00:00:00:00:00' &&
          !iface.mac.startsWith('00:15:5d') && // Hyper-V
          !iface.mac.startsWith('00:50:56') && // VMware
          !iface.mac.startsWith('08:00:27')    // VirtualBox
        )
        .map(iface => iface.mac)
        .sort()
        .join(',');

      const hardwareData = {
        machineId,
        cpuInfo,
        platform,
        arch,
        hostname,
        totalMemory,
        macAddresses
      };

      return crypto
        .createHash('sha256')
        .update(JSON.stringify(hardwareData))
        .digest('hex');
    } catch (error) {
      console.error('Error generating hardware fingerprint:', error);
      throw new Error('Cannot generate hardware fingerprint');
    }
  }

  /**
   * Get device binding information
   */
  getDeviceBinding() {
    try {
      return this.store.get('deviceBinding', null);
    } catch (error) {
      console.error('Error reading device binding:', error);
      return null;
    }
  }

  /**
   * Validate if current device matches stored binding
   */
  validateDeviceBinding() {
    try {
      const storedBinding = this.getDeviceBinding();
      if (!storedBinding) {
        return { isValid: false, reason: 'No device binding found' };
      }

      const currentFingerprint = this.getHardwareFingerprint();

      // Check if hardware fingerprint matches
      if (storedBinding.hardwareFingerprint !== currentFingerprint) {
        return {
          isValid: false,
          reason: 'Hardware fingerprint mismatch',
          details: {
            stored: storedBinding.hardwareFingerprint,
            current: currentFingerprint
          }
        };
      }

      // Check if binding is not expired (optional security measure)
      const bindingAge = Date.now() - new Date(storedBinding.bindTime).getTime();
      const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year

      if (bindingAge > maxAge) {
        return {
          isValid: false,
          reason: 'Device binding expired',
          bindingAge: Math.floor(bindingAge / (24 * 60 * 60 * 1000))
        };
      }

      return {
        isValid: true,
        bindingInfo: storedBinding
      };
    } catch (error) {
      console.error('Error validating device binding:', error);
      return {
        isValid: false,
        reason: 'Validation error',
        error: error.message
      };
    }
  }

  /**
   * Create device binding
   */
  createDeviceBinding() {
    try {
      const hardwareFingerprint = this.getHardwareFingerprint();
      const bindTime = new Date().toISOString();
      const deviceId = crypto.randomUUID();

      const deviceBinding = {
        deviceId,
        hardwareFingerprint,
        bindTime,
        platform: process.platform,
        arch: process.arch,
        hostname: os.hostname(),
        appVersion: require('../package.json').version
      };

      // Store in encrypted store
      this.store.set('deviceBinding', deviceBinding);

      // Also create a backup file for additional security
      try {
        fs.writeFileSync(
          this.deviceBindingFile,
          this.encryptData(JSON.stringify(deviceBinding))
        );
      } catch (fileError) {
        console.warn('Could not create device binding backup file:', fileError.message);
      }

      console.log('Device binding created successfully');
      return deviceBinding;
    } catch (error) {
      console.error('Error creating device binding:', error);
      throw new Error('Failed to create device binding');
    }
  }

  /**
   * Generate device hash for server authentication
   */
  generateDeviceHash(additionalData = '') {
    const validation = this.validateDeviceBinding();
    if (!validation.isValid) {
      throw new Error(`Device validation failed: ${validation.reason}`);
    }

    const binding = validation.bindingInfo;
    const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp

    const hashData = {
      deviceId: binding.deviceId,
      hardwareFingerprint: binding.hardwareFingerprint,
      timestamp,
      additionalData
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(hashData))
      .digest('hex');
  }

  /**
   * Get device information for server registration
   */
  getDeviceInfo() {
    const validation = this.validateDeviceBinding();
    if (!validation.isValid) {
      throw new Error(`Device validation failed: ${validation.reason}`);
    }

    const binding = validation.bindingInfo;
    return {
      deviceId: binding.deviceId,
      platform: binding.platform,
      arch: binding.arch,
      hostname: binding.hostname,
      bindTime: binding.bindTime,
      hardwareFingerprint: binding.hardwareFingerprint
    };
  }

  /**
   * Reset device binding (for debugging or reinitialization)
   */
  resetDeviceBinding() {
    try {
      this.store.delete('deviceBinding');

      if (fs.existsSync(this.deviceBindingFile)) {
        fs.unlinkSync(this.deviceBindingFile);
      }

      console.log('Device binding reset successfully');
      return true;
    } catch (error) {
      console.error('Error resetting device binding:', error);
      return false;
    }
  }

  /**
   * Encrypt data for backup storage using modern AES-256-GCM
   */
  encryptData(data) {
    const key = Buffer.from(this.getEncryptionKey().substring(0, 32), 'utf8');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipherGCM('aes-256-gcm', key, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt data from backup storage using modern AES-256-GCM
   */
  decryptData(encryptedData) {
    const key = Buffer.from(this.getEncryptionKey().substring(0, 32), 'utf8');
    const parts = encryptedData.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipherGCM('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Initialize device binding if not exists
   */
  initializeIfNeeded() {
    const validation = this.validateDeviceBinding();
    if (!validation.isValid) {
      console.log('Creating new device binding...');
      return this.createDeviceBinding();
    }

    console.log('Device binding is valid');
    return validation.bindingInfo;
  }
}

module.exports = SecureDeviceManager;
