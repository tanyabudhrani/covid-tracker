import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover';

interface CovidData {
  cases: number
  deaths: number
  recovered: number
  active: number
}

interface CountryData extends CovidData {
  country: string
  countryInfo: {
    lat: number
    long: number
    flag: string
  }
}

const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json"

export default function InteractiveCovidTracker() {
  const [globalData, setGlobalData] = useState<CovidData | null>(null)
  const [countryData, setCountryData] = useState<CountryData | null>(null)
  const [allCountriesData, setAllCountriesData] = useState<CountryData[]>([])
  const [searchCountry, setSearchCountry] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hoveredCountry, setHoveredCountry] = useState<CountryData | null>(null)

  useEffect(() => {
    fetchGlobalData()
    fetchAllCountriesData()
  }, [])

  const fetchGlobalData = async () => {
    setLoading(true)
    try {
      const response = await axios.get('https://disease.sh/v3/covid-19/all')
      setGlobalData(response.data)
      setError('')
    } catch (err) {
      setError('Failed to fetch global data')
    }
    setLoading(false)
  }

  const fetchAllCountriesData = async () => {
    try {
      const response = await axios.get('https://disease.sh/v3/covid-19/countries')
      setAllCountriesData(response.data)
    } catch (err) {
      setError('Failed to fetch countries data')
    }
  }

  const fetchCountryData = async () => {
    if (!searchCountry) return
    setLoading(true)
    try {
      const response = await axios.get(`https://disease.sh/v3/covid-19/countries/${searchCountry}`)
      setCountryData(response.data)
      setError('')
    } catch (err) {
      setError(`Failed to fetch data for ${searchCountry}`)
      setCountryData(null)
    }
    setLoading(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchCountryData()
  }

  const renderStats = (data: CovidData | null, title: string) => {
    if (!data) return null
    return (
      <Card className="mb-6 bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-primary">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cases</p>
              <p className="text-2xl font-bold text-primary">{data.cases.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Deaths</p>
              <p className="text-2xl font-bold text-destructive">{data.deaths.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Recovered</p>
              <p className="text-2xl font-bold text-green-600">{data.recovered.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-amber-500">{data.active.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderChart = (data: CovidData | null) => {
    if (!data) return null
    const chartData = [
      { name: 'Cases', value: data.cases },
      { name: 'Deaths', value: data.deaths },
      { name: 'Recovered', value: data.recovered },
      { name: 'Active', value: data.active },
    ]

    return (
      <Card className="mb-6 bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-primary">Data Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    )
  }

  const renderMap = () => {
    return (
      <Card className="mb-6 bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-primary">Interactive COVID-19 World Map</CardTitle>
        </CardHeader>
        <CardContent>
          <ComposableMap>
            <ZoomableGroup zoom={1}>
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="hsl(var(--muted))"
                      stroke="hsl(var(--border))"
                    />
                  ))
                }
              </Geographies>
              {allCountriesData.map((country) => (
                <Marker key={country.country} coordinates={[country.countryInfo.long, country.countryInfo.lat]}>
                  <Popover>
                    <PopoverTrigger asChild>
                      <circle
                        r={Math.log(country.cases) / 2}
                        fill="hsl(var(--primary))"
                        opacity={0.7}
                        onMouseEnter={() => setHoveredCountry(country)}
                        onMouseLeave={() => setHoveredCountry(null)}
                        className="cursor-pointer"
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <h4 className="font-bold">{country.country}</h4>
                          <img src={country.countryInfo.flag} alt={`${country.country} flag`} className="w-8 h-6" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Cases</p>
                            <p className="text-lg font-bold text-primary">{country.cases.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Deaths</p>
                            <p className="text-lg font-bold text-destructive">{country.deaths.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Recovered</p>
                            <p className="text-lg font-bold text-green-600">{country.recovered.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Active</p>
                            <p className="text-lg font-bold text-amber-500">{country.active.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </Marker>
              ))}
            </ZoomableGroup>
          </ComposableMap>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto p-4 bg-background text-foreground">
      <h1 className="text-3xl font-bold mb-6 text-primary">Interactive COVID-19 Tracker</h1>

      {loading && (
        <div className="flex items-center justify-center mb-4">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <p>Loading...</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {renderStats(globalData, 'Global Statistics')}

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex space-x-2">
          <Input
            type="text"
            value={searchCountry}
            onChange={(e) => setSearchCountry(e.target.value)}
            placeholder="Enter country name"
            className="flex-grow"
          />
          <Button type="submit">Search</Button>
        </div>
      </form>

      {renderStats(countryData, `Statistics for ${searchCountry}`)}
      {renderChart(countryData || globalData)}
      {renderMap()}
    </div>
  )
}