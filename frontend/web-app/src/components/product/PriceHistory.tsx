import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface PriceHistoryProps {
  productId: string;
  productName: string;
}

interface PricePoint {
  date: string;
  price: number;
}

const PriceHistory: React.FC<PriceHistoryProps> = ({ productId, productName }) => {
  // In real application, this data would come from an API
  const priceData: PricePoint[] = [
    { date: '2025-01-15', price: 1299.99 },
    { date: '2025-02-15', price: 1249.99 },
    { date: '2025-03-15', price: 1199.99 },
    { date: '2025-04-15', price: 1229.99 },
    { date: '2025-05-15', price: 1179.99 },
    { date: '2025-06-15', price: 1149.99 },
    { date: '2025-07-15', price: 1199.99 },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  const chartData = {
    labels: priceData.map((item) => formatDate(item.date)),
    datasets: [
      {
        label: 'Narx, $',
        data: priceData.map((item) => item.price),
        fill: false,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${productName} - Narx tarixi`,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `Narx: $${context.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value: any) => `$${value}`,
        },
      },
    },
  };

  // Calculate price statistics
  const currentPrice = priceData[priceData.length - 1].price;
  const lowestPrice = Math.min(...priceData.map((item) => item.price));
  const highestPrice = Math.max(...priceData.map((item) => item.price));
  const avgPrice = priceData.reduce((sum, item) => sum + item.price, 0) / priceData.length;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Narx tarixi</h3>

      <div className="h-64 mb-4">
        <Line data={chartData} options={options} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm text-gray-500">Joriy narx</p>
          <p className="font-bold text-blue-600">${currentPrice.toFixed(2)}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm text-gray-500">Eng past narx</p>
          <p className="font-bold text-green-600">${lowestPrice.toFixed(2)}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm text-gray-500">Eng yuqori narx</p>
          <p className="font-bold text-red-600">${highestPrice.toFixed(2)}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm text-gray-500">O'rtacha narx</p>
          <p className="font-bold text-gray-700">${avgPrice.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default PriceHistory;
