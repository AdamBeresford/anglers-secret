import { v4 as uuidv4 } from 'uuid';

export class HistoricalWeather {
  weatherId: string;
  data: {
    location: {
      name: string;
      region: string;
      country: string;
    };
    historicalWeather: {
      date: string;
      tempC: number;
      totalPrecipMm: number;
      uv: number;
      morning: {
        cloudCover: number;
        precipMm: number;
        windMph: number;
        windDir: string;
        pressureMb: number;
        humidity: number;
      };
      midday: {
        cloudCover: number;
        precipMm: number;
        windMph: number;
        windDir: string;
        pressureMb: number;
        humidity: number;
      };
      evening: {
        cloudCover: number;
        precipMm: number;
        windMph: number;
        windDir: string;
        pressureMb: number;
        humidity: number;
      };
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
      historicalWeather: {
        date: requestData.forecast.forecastday[0].date,
        tempC: requestData.forecast.forecastday[0].day.avgtemp_c,
        totalPrecipMm: requestData.forecast.forecastday[0].day.totalprecip_mm,
        uv: requestData.forecast.forecastday[0].day.uv,
        morning: {
          cloudCover: requestData.forecast.forecastday[0].hour[7].cloud,
          precipMm: requestData.forecast.forecastday[0].hour[7].precip_mm,
          windMph: requestData.forecast.forecastday[0].hour[7].wind_mph,
          windDir: requestData.forecast.forecastday[0].hour[7].wind_dir,
          pressureMb: requestData.forecast.forecastday[0].hour[7].pressure_mb,
          humidity: requestData.forecast.forecastday[0].hour[7].humidity,
        },
        midday: {
          cloudCover: requestData.forecast.forecastday[0].hour[12].cloud,
          precipMm: requestData.forecast.forecastday[0].hour[12].precip_mm,
          windMph: requestData.forecast.forecastday[0].hour[12].wind_mph,
          windDir: requestData.forecast.forecastday[0].hour[12].wind_dir,
          pressureMb: requestData.forecast.forecastday[0].hour[12].pressure_mb,
          humidity: requestData.forecast.forecastday[0].hour[12].humidity,
        },
        evening: {
          cloudCover: requestData.forecast.forecastday[0].hour[18].cloud,
          precipMm: requestData.forecast.forecastday[0].hour[18].precip_mm,
          windMph: requestData.forecast.forecastday[0].hour[18].wind_mph,
          windDir: requestData.forecast.forecastday[0].hour[18].wind_dir,
          pressureMb: requestData.forecast.forecastday[0].hour[18].pressure_mb,
          humidity: requestData.forecast.forecastday[0].hour[18].humidity,
        },
      },
    };
  }
}