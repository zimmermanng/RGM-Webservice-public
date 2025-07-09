import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet
} from "@react-pdf/renderer";

// Remove font registration to debug
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12, // Make sure text has a readable size
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  paragraph: {
    fontSize: 12,
    marginBottom: 10,
  },
});

const PDFExport = () => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Ergebnisbericht</Text>

        <View>
          <Text style={styles.paragraph}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </Text>
          <Text style={styles.paragraph}>
            Duis vehicula, odio at placerat pharetra, ligula risus venenatis justo.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default PDFExport;


