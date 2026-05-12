import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Shuffle start page', () => {
  render(<App />);
  expect(screen.getByText(/Shuffle RGM-Prüfwerkzeug/i)).toBeInTheDocument();
});
