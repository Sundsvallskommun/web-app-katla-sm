//Subscribed APIS as lowercased
export const APIS = [
  {
    name: 'simulatorserver',
    version: '2.0',
  },
  {
    name: 'supportmanagement',
    version: '12.0',
  },
  {
    name: 'employee',
    version: '2.0',
  },
  {
    name: 'citizen',
    version: '3.0',
  },
] as const;

export const getApiBase = (name: string) => {
  const api = APIS.find(api => api.name === name);
  return `${api?.name}/${api?.version}`;
};
