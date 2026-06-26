import { useEffect, useRef } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

const loader = new Loader({
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  libraries: ['places'],
})

export default function PlacesAutocomplete({ value, onChange, placeholder = 'City, State or address' }) {
  const inputRef = useRef(null)
  const autoRef = useRef(null)

  useEffect(() => {
    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) return

    loader.load().then(google => {
      autoRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['geocode'],
        componentRestrictions: { country: 'us' },
      })
      autoRef.current.addListener('place_changed', () => {
        const place = autoRef.current.getPlace()
        onChange(place.formatted_address || inputRef.current.value)
      })
    })
  }, [])

  return (
    <input
      ref={inputRef}
      defaultValue={value}
      placeholder={placeholder}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  )
}