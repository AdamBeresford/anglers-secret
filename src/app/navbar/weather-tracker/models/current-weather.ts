import { v4 as uuidv4 } from 'uuid';

export class CurrentWeather {
  weatherId: string;
  data: {
    location: {
      name: string;
      region: string;
      country: string;
    };
    currentWeather: {
      lastUpdated: string;
      tempC: number;
      windMph: number;
      windDir: string;
      pressureMb: number;
      precipMm: number;
      cloudCover: number;
      uv: number;
    };
  };

  constructor(requestData: any) {
    this.weatherId = uuidv4();
    this.data = {
      location: {
        name: requestData.location.name,
        region: requestData.location.region,
        country: requestData.location.country,
      },
      currentWeather: {
        lastUpdated: requestData.current.last_updated,
        tempC: requestData.current.temp_c,
        windMph: requestData.current.wind_mph,
        windDir: requestData.current.wind_dir,
        pressureMb: requestData.current.pressure_mb,
        precipMm: requestData.current.precip_mm,
        cloudCover: requestData.current.cloud,
        uv: requestData.current.uv,
      },
    };
  }
}