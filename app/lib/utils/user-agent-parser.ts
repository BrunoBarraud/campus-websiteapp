/**
 * Utilidad para analizar el user-agent y obtener información del navegador y sistema operativo
 * 
 * Nota: Esta es una implementación simplificada que simula la funcionalidad de ua-parser-js
 * debido a restricciones para instalar nuevas dependencias.
 */

interface Browser {
  name?: string;
  version?: string;
}

interface OS {
  name?: string;
  version?: string;
}

interface Device {
  type?: string;
  model?: string;
  vendor?: string;
}

interface UAParserResult {
  browser: Browser;
  os: OS;
  device: Device;
}

export class UAParser {
  private ua: string;

  constructor(ua: string = '') {
    this.ua = ua || (typeof window !== 'undefined' ? window.navigator.userAgent : '');
  }

  getBrowser(): Browser {
    const browser: Browser = { name: 'Unknown', version: '' };
    
    // Detectar navegadores comunes
    if (this.ua.includes('Firefox/')) {
      browser.name = 'Firefox';
      const match = this.ua.match(/Firefox\/(\d+(\.\d+)?)/);
      if (match) browser.version = match[1];
    } else if (this.ua.includes('Chrome/') && !this.ua.includes('Edg/') && !this.ua.includes('OPR/')) {
      browser.name = 'Chrome';
      const match = this.ua.match(/Chrome\/(\d+(\.\d+)?)/);
      if (match) browser.version = match[1];
    } else if (this.ua.includes('Safari/') && !this.ua.includes('Chrome/') && !this.ua.includes('Edg/')) {
      browser.name = 'Safari';
      const match = this.ua.match(/Version\/(\d+(\.\d+)?)/);
      if (match) browser.version = match[1];
    } else if (this.ua.includes('Edg/')) {
      browser.name = 'Edge';
      const match = this.ua.match(/Edg\/(\d+(\.\d+)?)/);
      if (match) browser.version = match[1];
    } else if (this.ua.includes('OPR/') || this.ua.includes('Opera/')) {
      browser.name = 'Opera';
      const match = this.ua.match(/(?:OPR|Opera)\/(\d+(\.\d+)?)/);
      if (match) browser.version = match[1];
    }
    
    return browser;
  }

  getOS(): OS {
    const os: OS = { name: 'Unknown', version: '' };
    
    // Detectar sistemas operativos comunes
    if (this.ua.includes('Windows')) {
      os.name = 'Windows';
      if (this.ua.includes('Windows NT 10.0')) os.version = '10';
      else if (this.ua.includes('Windows NT 6.3')) os.version = '8.1';
      else if (this.ua.includes('Windows NT 6.2')) os.version = '8';
      else if (this.ua.includes('Windows NT 6.1')) os.version = '7';
    } else if (this.ua.includes('Mac OS X')) {
      os.name = 'Mac OS';
      const match = this.ua.match(/Mac OS X (\d+[._]\d+(?:[._]\d+)?)/);
      if (match) os.version = match[1].replace(/_/g, '.');
    } else if (this.ua.includes('Android')) {
      os.name = 'Android';
      const match = this.ua.match(/Android (\d+(\.\d+)?)/);
      if (match) os.version = match[1];
    } else if (this.ua.includes('iOS') || this.ua.includes('iPhone OS') || this.ua.includes('iPad')) {
      os.name = 'iOS';
      const match = this.ua.match(/OS (\d+[._]\d+(?:[._]\d+)?)/);
      if (match) os.version = match[1].replace(/_/g, '.');
    } else if (this.ua.includes('Linux')) {
      os.name = 'Linux';
    }
    
    return os;
  }

  getDevice(): Device {
    const device: Device = { type: 'desktop', model: '', vendor: '' };
    
    // Detectar dispositivos móviles
    if (this.ua.includes('iPhone')) {
      device.type = 'mobile';
      device.model = 'iPhone';
      device.vendor = 'Apple';
    } else if (this.ua.includes('iPad')) {
      device.type = 'tablet';
      device.model = 'iPad';
      device.vendor = 'Apple';
    } else if (this.ua.includes('Android')) {
      device.type = this.ua.includes('Mobile') ? 'mobile' : 'tablet';
      
      // Intentar detectar fabricantes comunes de Android
      if (this.ua.includes('Samsung')) device.vendor = 'Samsung';
      else if (this.ua.includes('Huawei')) device.vendor = 'Huawei';
      else if (this.ua.includes('Xiaomi')) device.vendor = 'Xiaomi';
      else if (this.ua.includes('OPPO')) device.vendor = 'OPPO';
      else device.vendor = 'Unknown';
    }
    
    return device;
  }

  getResult(): UAParserResult {
    return {
      browser: this.getBrowser(),
      os: this.getOS(),
      device: this.getDevice()
    };
  }
}