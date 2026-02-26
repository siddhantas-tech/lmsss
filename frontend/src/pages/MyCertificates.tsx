import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, Download, Calendar, BookOpen, CheckCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { getMyCertificates, type Certificate } from '@/api/certificates'
import { useAuth } from '@/context/AuthContext'

export default function MyCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user?.id) {
      loadMyCertificates()
    }
  }, [user])

  const loadMyCertificates = async () => {
    try {
      const response = await getMyCertificates(user!.id)
      setCertificates(response.data || [])
    } catch (error) {
      console.error('Failed to load certificates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (certificateUrl: string) => {
    window.open(certificateUrl, '_blank')
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
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b pb-6">
          <h1 className="text-4xl font-black uppercase tracking-tight">My Certificates</h1>
          <p className="text-muted-foreground mt-2">View and download your earned certificates</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="h-4 w-4" />
                Certificates Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{certificates.length}</div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-emerald-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">Issued</div>
            </CardContent>
          </Card>
        </div>

        {/* Certificates List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold uppercase tracking-tight">Issued Certificates</h2>
          
          {certificates.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold">No Certificates Yet</h3>
                <p className="text-muted-foreground text-sm mb-4">Complete courses and pass exams to earn certificates</p>
                <Link to="/courses">
                  <Button>Browse Courses</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {certificates.map((certificate) => (
                <Card key={certificate.id} className="border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                          <Award className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-xl">Certificate of Completion</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              Course ID: {certificate.course_id.slice(0, 8)}...
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Issued: {new Date(certificate.issued_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Issued
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={() => handleDownload(certificate.certificate_url)}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.open(certificate.certificate_url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Back to Courses */}
        <div className="text-center pt-8">
          <Link to="/courses">
            <Button variant="outline" size="lg">
              Back to Courses
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
