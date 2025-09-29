export class DeviceViewModel {
  ip: string;
  title: string; //received by parsing http header "user-agent"
  lastActiveDate: string; //date of the last generating of refresh/access tokens
  deviceId: string;
}
