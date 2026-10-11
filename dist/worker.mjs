import { convert } from './converter.mjs';
self.onmessage = ({ data }) => {
  try {
    self.postMessage({ id: data.id, result: convert(data.source, data.options) });
  } catch {
    self.postMessage({ id: data.id, failure: 'Conversion stopped unexpectedly. Try a smaller sketch. If the problem continues, include your selected device and settings when reporting it.' });
  }
};
