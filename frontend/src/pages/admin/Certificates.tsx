import { useEffect, useState } from 'react'
import { Award, CheckCircle, Clock, User, BookOpen, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { getPendingCertificates, approveCertificate, type Certificate } from '@/api/certificates'
import { useToast } from '@/hooks/use-toast'

export default function CertificatesPage() {
  const [pendingCertificates, setPendingCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadPendingCertificates()
  }, [])

  const loadPendingCertificates = async () => {
    try {
      const response = await getPendingCertificates()
      setPendingCertificates(response.data || [])
    } catch (error) {
      console.error('Failed to load pending certificates:', error)
      toast({
        title: "Error",
        description: "Failed to load pending certificates",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (certificateId: string) => {
    setApproving(certificateId)
    try {
      await approveCertificate(certificateId)
      setPendingCertificates(prev => prev.filter(cert => cert.id !== certificateId))
      toast({
        title: "Certificate Approved",
        description: "Certificate has been issued and email sent to student",
      })
    } catch (error) {
      console.error('Failed to approve certificate:', error)
      toast({
        title: "Error",
        description: "Failed to approve certificate",
        variant: "destructive"
      })
    } finally {
      setApproving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b pb-6">
          <h1 className="text-4xl font-black uppercase tracking-tight">Certificate Management</h1>
          <p className="text-muted-foreground mt-2">Review and approve pending certificate requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingCertificates.length}</div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-emerald-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Total Issued
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">--</div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-blue-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="h-4 w-4" />
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">--%</div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Certificates */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold uppercase tracking-tight">Pending Certificates</h2>
          
          {pendingCertificates.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold">No Pending Certificates</h3>
                <p className="text-muted-foreground text-sm">All certificates have been reviewed and approved.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingCertificates.map((certificate) => (
                <Card key={certificate.id} className="border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Award className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">Certificate Request</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              User ID: {certificate.user_id.slice(0, 8)}...
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              Course ID: {certificate.course_id.slice(0, 8)}...
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(certificate.issued_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium text-amber-600">Pending Approval</p>
                          <p className="text-xs text-muted-foreground">Click to issue certificate</p>
                        </div>
                        <Button
                          onClick={() => handleApprove(certificate.id)}
                          disabled={approving === certificate.id}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          {approving === certificate.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
