import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

// Register hyphenation callback to prevent word breaks
Font.registerHyphenationCallback(word => [word]);

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    // fontFamily: "Times-Roman",
    fontSize: 12,
  },
  content: {
    lineHeight: 1.5,
  },
  paragraph: {
    marginBottom: 10,
  },
});

type TextPreviewPDFProps = {
  content: string;
};

const TextPreviewPDF = ({ content }: TextPreviewPDFProps) => {
  // Split content into paragraphs
  const paragraphs = content.split("\n");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.content}>
          {paragraphs.map((paragraph, index) => (
            <Text key={index} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export default TextPreviewPDF;