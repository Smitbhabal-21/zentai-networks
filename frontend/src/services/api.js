import axios from 'axios'

const BASE = '/api'

export const api = {
    companies: () => axios.get(`${BASE}/companies`),
    financial: (co) => axios.get(`${BASE}/financial/${co}`),
    stock: (co, period = '1y') => axios.get(`${BASE}/stock/${co}?period=${period}`),
    supply: (co) => axios.get(`${BASE}/supply/${co}`),
    risk: (co) => axios.get(`${BASE}/risk/${co}`),
    markets: () => axios.get(`${BASE}/markets`),
    incidents: (co) => axios.get(`${BASE}/incidents/${co}`),
}
