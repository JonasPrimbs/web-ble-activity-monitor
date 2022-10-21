export const ERR_SERVER_NOT_CONNECTED = 'GATT server is not connected';
export const ERR_REQUIRED_SERVICE_NOT_FOUND = 'A required GATT service was not found';

export class Sensor {
  /**
   * Internal storage of connected services.
   */
  private readonly connectedServices: { [id: BluetoothServiceUUID]: BluetoothRemoteGATTService } = {};

  /**
   * Gets a copy of connected services.
   */
  get services(): { [id: BluetoothServiceUUID]: BluetoothRemoteGATTService } {
    return { ...this.connectedServices };
  }

  /**
   * Gets the IDs of the connected services.
   */
  get serviceIds(): BluetoothServiceUUID[] {
    return Object.keys(this.services);
  }

  /**
   * Gets the name of the sensor device.
   */
  get name(): string | undefined {
    return this.device.name;
  }

  /**
   * Gets whether the device is connected (true) or not (false).
   */
  get connected(): boolean {
    return this.server.connected;
  }

  /**
   * Constructs a new Sensor instance.
   * @param device The connected Bluetooth device instance.
   * @param server The connected Bluetooth GATT server instance.
   */
  constructor(
    private readonly device: BluetoothDevice,
    private readonly server: BluetoothRemoteGATTServer,
  ) {}

  /**
   * Connects the GATT services.
   * @param serviceIds Enumeration of service UUIDs of required and optional GATT services to connect.
   * @throws ERR_SERVER_NOT_CONNECTED
   * @throws ERR_REQUIRED_SERVICE_NOT_FOUND
   */
  async connectServices(serviceIds: { required: BluetoothServiceUUID[], optional?: BluetoothServiceUUID[] }): Promise<void> {
    if (!this.server.connected) {
      console.error(`[ERROR] ${ERR_SERVER_NOT_CONNECTED}`);
      throw ERR_SERVER_NOT_CONNECTED;
    }

    // Connect required and optional services.
    const services: { [id: BluetoothServiceUUID]: BluetoothRemoteGATTService } = {};
    try {
      await Promise.allSettled([
        // Required services throw their connection exceptions directly and must be defined.
        ...serviceIds.required.map(
          async id => {
            // Skip already connected services.
            if (id in this.services) {
              return;
            }
            // Try to connect service.
            // Throw exceptions directly.
            const service = await this.server.getPrimaryService(id);
            if (!service) {
              throw `Service with ID "${id}" not found`;
            } else {
              services[id] = service;
            }
          },
        ),
        // If getting optional services fails, they will be dropped.
        ...(serviceIds.optional !== null ? serviceIds.optional!.map(
          async id => {
            // Skip already connected services.
            if (id in this.services) {
              return;
            }
            // Try to connect to the service.
            // Catch exceptions and skip the service.
            try {
              const service = await this.server.getPrimaryService(id);
              if (!service) {
                throw `Service with ID "${id}" not found`;
              } else {
                services[id] = service;
              }
            } catch (error) {
              console.log(`[INFO] Service with ID "${id}" was not found`);
            }
          },
        ) : []),
      ]);
    } catch (error) {
      console.error(`[ERROR] ${ERR_REQUIRED_SERVICE_NOT_FOUND}:`, error);
      throw ERR_REQUIRED_SERVICE_NOT_FOUND;
    }

    // Add services to connected services.
    for (const id in services) {
      this.connectedServices[id] = services[id];
    }
  }

  /**
   * Disconnects the sensor.
   */
  async disconnect(): Promise<void> {
    // Clear connected GATT services.
    for (const id in this.connectedServices) {
      delete this.connectedServices[id];
    }    

    // Disconnect from GATT server.
    if (this.server.connected) {
      try {
        this.server.disconnect();
      } catch {
      }
    }

    // Forget the device.
    try {
      await this.device.forget();
    } catch {
    }
  }
}
