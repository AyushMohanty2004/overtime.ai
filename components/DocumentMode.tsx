import React, { useState } from 'react';
import { useAppContext } from '../lib/context';

const DocumentMode: React.FC = () => {
  const { documentContent, setDocumentContent } = useAppContext();
  const [isEditing, setIsEditing] = useState(!documentContent);

  // Sample document content for demo purposes
  const sampleDocument = `# Chapter 3: Market Indicators

## Introduction to Market Indicators

Market indicators are statistical metrics used by traders to evaluate and forecast market conditions. They provide insights into market trends, momentum, volatility, and potential reversals.

## Types of Market Indicators

### Trend Indicators
- **Moving Averages**: Smooth price data to identify trends
- **MACD (Moving Average Convergence Divergence)**: Shows relationship between two moving averages
- **ADX (Average Directional Index)**: Measures trend strength

### Momentum Indicators
- **RSI (Relative Strength Index)**: Measures speed and change of price movements
- **Stochastic Oscillator**: Compares closing price to price range over time
- **CCI (Commodity Channel Index)**: Identifies cyclical trends

### Volume Indicators
- **On-Balance Volume (OBV)**: Relates volume to price change
- **Volume Rate of Change**: Measures volume momentum
- **Chaikin Money Flow**: Evaluates buying and selling pressure

## Using Indicators in Trading Strategies

Effective trading strategies often combine multiple indicators from different categories. For example:
1. Use trend indicators to identify the overall market direction
2. Confirm with momentum indicators to gauge strength
3. Validate with volume indicators to ensure sufficient market participation

## Common Mistakes to Avoid

- **Indicator Overload**: Using too many indicators can lead to analysis paralysis
- **Lagging Indicators**: Remember that most indicators are based on past data
- **Confirmation Bias**: Avoid selecting indicators that only confirm your existing bias

## Conclusion

Market indicators are valuable tools when used properly. They should be part of a comprehensive trading strategy that includes risk management and an understanding of fundamental factors affecting the market.`;

  const handleUseDemo = () => {
    setDocumentContent(sampleDocument);
    setIsEditing(false);
  };

  const handleSaveDocument = () => {
    setIsEditing(false);
  };

  return (
    <div className="h-full flex flex-col p-4 overflow-y-auto">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Document Study Mode</h2>
        <p className="text-sm text-gray-600 mb-4">Load a document to study and ask questions about it in the chat.</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={handleUseDemo}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 flex-grow"
          >
            Use Demo Document
          </button>
          
          {/* Future implementation: Upload Document button */}
          <button
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 flex-grow cursor-not-allowed"
            title="Coming soon!"
          >
            Upload Your Document
          </button>
        </div>
        
        {documentContent && (
          <div className="flex justify-end">
            {isEditing ? (
              <button
                onClick={handleSaveDocument}
                className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600"
              >
                Save Document
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600"
              >
                Edit Document
              </button>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <textarea
          value={documentContent}
          onChange={(e) => setDocumentContent(e.target.value)}
          placeholder="Paste or type your document content here..."
          className="flex-1 p-4 border rounded-lg resize-none font-mono text-sm"
          style={{ minHeight: "300px" }}
        />
      ) : (
        <div className="flex-1 p-4 border rounded-lg overflow-y-auto bg-white shadow-sm">
          {documentContent ? (
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm">{documentContent}</pre>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <p>Select or upload a document to begin.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentMode;
