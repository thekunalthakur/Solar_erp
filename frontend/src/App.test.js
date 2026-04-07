import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Savorka logo in navbar', () => {
  render(<App />);
  const logoElement = screen.getByAltText(/Savorka Logo/i);
  expect(logoElement).toBeInTheDocument();
});
