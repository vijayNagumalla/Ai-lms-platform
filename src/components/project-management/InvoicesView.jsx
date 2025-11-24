import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

const InvoicesView = ({ selectedProject }) => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      let response;
      if (user?.role === 'faculty') {
        response = await api.getFacultyInvoices(user.id);
      } else {
        response = await api.getInvoices();
      }
      if (response.success) {
        setInvoices(response.data || []);
      }
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (invoice) => {
    if (invoice.pdf_url) {
      window.open(invoice.pdf_url, '_blank');
    } else {
      toast.error('PDF not available');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-500',
      sent: 'bg-blue-500',
      paid: 'bg-green-500',
      overdue: 'bg-red-500',
      cancelled: 'bg-gray-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  if (loading) {
    return <div className="text-center py-8">Loading invoices...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices.map(invoice => (
              <div key={invoice.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{invoice.invoice_number}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {invoice.faculty_name} • {invoice.college_name}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Period: {new Date(invoice.billing_period_start).toLocaleDateString()} - {new Date(invoice.billing_period_end).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {invoice.total_hours}h @ ₹{invoice.hourly_rate}/hr
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">₹{invoice.net_payable?.toFixed(2)}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {invoice.tds_amount > 0 && `TDS: ₹${invoice.tds_amount.toFixed(2)}`}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                      {invoice.pdf_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(invoice)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          PDF
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {invoices.length === 0 && (
              <div className="text-center py-8 text-gray-500">No invoices found</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoicesView;

