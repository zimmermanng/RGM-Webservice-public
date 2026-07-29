const textEncoder = new TextEncoder();

export function createZipBlob(files) {
  const localParts = [];
  const directoryParts = [];
  let offset = 0;

  files.forEach(({ name, content }) => {
    const nameBytes = textEncoder.encode(name);
    const contentBytes =
      content instanceof Uint8Array ? content : textEncoder.encode(content);
    const checksum = crc32(contentBytes);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint32(14, checksum, true);
    localView.setUint32(18, contentBytes.length, true);
    localView.setUint32(22, contentBytes.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localHeader.set(nameBytes, 30);
    localParts.push(localHeader, contentBytes);

    const directoryHeader = new Uint8Array(46 + nameBytes.length);
    const directoryView = new DataView(directoryHeader.buffer);
    directoryView.setUint32(0, 0x02014b50, true);
    directoryView.setUint16(4, 20, true);
    directoryView.setUint16(6, 20, true);
    directoryView.setUint16(8, 0x0800, true);
    directoryView.setUint16(10, 0, true);
    directoryView.setUint32(16, checksum, true);
    directoryView.setUint32(20, contentBytes.length, true);
    directoryView.setUint32(24, contentBytes.length, true);
    directoryView.setUint16(28, nameBytes.length, true);
    directoryView.setUint32(42, offset, true);
    directoryHeader.set(nameBytes, 46);
    directoryParts.push(directoryHeader);

    offset += localHeader.length + contentBytes.length;
  });

  const directorySize = directoryParts.reduce(
    (total, part) => total + part.length,
    0
  );
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, directorySize, true);
  endView.setUint32(16, offset, true);

  return new Blob([...localParts, ...directoryParts, end], {
    type: "application/zip",
  });
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
