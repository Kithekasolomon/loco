import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CProgress,
  CProgressBar,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CSpinner,
  CAlert,
  CBadge,
  CButton,
} from '@coreui/react'
import { CIcon } from '@coreui/icons-react'
import {
  cilBuilding,
  cilMoney,
  cilChartPie,
  cilClock,
  cilCheckCircle,
  cilWarning,
  cilCalendar,
  cilBarChart,
} from '@coreui/icons'
import { Link } from 'react-router-dom'
import api from 'src/api/axios'
import { CChartLine, CChartBar } from '@coreui/react-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js'
import 'chartjs-adapter-date-fns'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
)

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalContractSum: 0,
    valuedToDate: 0,
    overallProgress: 0,
  })

  const [recentProjects, setRecentProjects] = useState([])
  const [monthlyValuations, setMonthlyValuations] = useState([])
  const [ganttData, setGanttData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError('')

        const { data: projects } = await api.get('/api/projects')

        const activeProjects = projects.filter((p) => p.status === 'ACTIVE')
        const totalContractSum = projects.reduce(
          (sum, p) => sum + (p.boq?.summary?.totalContractSum || 0),
          0,
        )
        const valuedToDate = projects.reduce(
          (sum, p) => sum + (p.boq?.summary?.valuedToDate || 0),
          0,
        )
        const overallProgress =
          totalContractSum > 0 ? ((valuedToDate / totalContractSum) * 100).toFixed(1) : 0

        setStats({
          totalProjects: projects.length,
          activeProjects: activeProjects.length,
          totalContractSum,
          valuedToDate,
          overallProgress,
        })

        const sortedRecent = projects
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 8)
        setRecentProjects(sortedRecent)

       
        const months = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ]
        const currentMonth = new Date().getMonth()
        const monthlyData = months
          .map((month, index) => ({
            month,
            value: ((valuedToDate * (index + 1)) / 12) * (Math.random() * 0.3 + 0.8), 
          }))
          .slice(0, currentMonth + 1)

        setMonthlyValuations(monthlyData)

        // Gantt Data for Active Projects
        const gantt = activeProjects.slice(0, 6).map((p) => ({
          project: p.name.substring(0, 20) + (p.name.length > 20 ? '...' : ''),
          start: new Date(p.timelineStart),
          end: new Date(p.timelineEnd),
          progress: p.boq?.summary?.percentageComplete || 0,
        }))
        setGanttData(gantt)
      } catch (err) {
        setError('Failed to load dashboard data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount || 0)
  }

  const getProgressColor = (percent) => {
    if (percent >= 90) return 'success'
    if (percent >= 70) return 'info'
    if (percent >= 50) return 'warning'
    return 'danger'
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" size="lg" />
        <p className="mt-3 text-muted">Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return <CAlert color="danger">{error}</CAlert>
  }

  return (
    <>
      {/* Stats Cards */}
      <CRow className="mb-4">
        <CCol sm={6} lg={3}>
          <CCard className="shadow-sm border-0">
            <CCardBody className="text-center">
              <CIcon icon={cilBuilding} size="xl" className="text-primary mb-3" />
              <h4 className="mb-1">{stats.totalProjects}</h4>
              <p className="text-muted mb-0">Total Projects</p>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol sm={6} lg={3}>
          <CCard className="shadow-sm border-0">
            <CCardBody className="text-center">
              <CIcon icon={cilCheckCircle} size="xl" className="text-success mb-3" />
              <h4 className="mb-1">{stats.activeProjects}</h4>
              <p className="text-muted mb-0">Active Projects</p>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol sm={6} lg={3}>
          <CCard className="shadow-sm border-0">
            <CCardBody className="text-center">
              <CIcon icon={cilMoney} size="xl" className="text-info mb-3" />
              <h5 className="mb-1">{formatCurrency(stats.totalContractSum)}</h5>
              <p className="text-muted mb-0">Total Contract Value</p>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol sm={6} lg={3}>
          <CCard className="shadow-sm border-0">
            <CCardBody className="text-center">
              <CIcon icon={cilChartPie} size="xl" className="text-warning mb-3" />
              <h5 className="mb-1">{formatCurrency(stats.valuedToDate)}</h5>
              <p className="text-muted mb-0">Valued to Date</p>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Overall Progress */}
      <CCard className="mb-4 shadow-sm">
        <CCardHeader>
          <h5 className="mb-0">Overall Company Progress</h5>
        </CCardHeader>
        <CCardBody>
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h2 className="mb-0">{stats.overallProgress}%</h2>
              <p className="text-muted">Across all active projects</p>
            </div>
            <div className="w-75">
              <CProgress height={30}>
                <CProgressBar
                  color={getProgressColor(stats.overallProgress)}
                  value={stats.overallProgress}
                  animated
                  striped
                >
                  {stats.overallProgress}%
                </CProgressBar>
              </CProgress>
            </div>
          </div>
        </CCardBody>
      </CCard>

      {/* Monthly Valuations Chart */}
      <CCard className="mb-4 shadow-sm">
        <CCardHeader>
          <h5 className="mb-0">
            <CIcon icon={cilBarChart} className="me-2" />
            Monthly Cumulative Valuations (2026)
          </h5>
        </CCardHeader>
        <CCardBody>
          <CChartLine
            data={{
              labels: monthlyValuations.map((m) => m.month),
              datasets: [
                {
                  label: 'Cumulative Valued (KES)',
                  data: monthlyValuations.map((m) => m.value),
                  borderColor: '#4f46e5',
                  backgroundColor: 'rgba(79, 70, 229, 0.1)',
                  fill: true,
                  tension: 0.4,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: { display: false },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => formatCurrency(value),
                  },
                },
              },
            }}
          />
        </CCardBody>
      </CCard>

      {/* Project Timeline Gantt */}
      <CCard className="mb-4 shadow-sm">
        <CCardHeader>
          <h5 className="mb-0">
            <CIcon icon={cilCalendar} className="me-2" />
            Project Timeline Gantt Chart
          </h5>
        </CCardHeader>
        <CCardBody>
          {ganttData.length === 0 ? (
            <p className="text-center text-muted py-4">No active projects to display</p>
          ) : (
            <CChartBar
              type="bar"
              data={{
                labels: ganttData.map((p) => p.project),
                datasets: [
                  {
                    label: 'Duration',
                    data: ganttData.map((p) => ({
                      x: [p.start, p.end],
                      y: p.project,
                    })),
                    backgroundColor: 'rgba(99, 102, 241, 0.6)',
                    barThickness: 20,
                  },
                  {
                    label: 'Progress',
                    data: ganttData.map((p) => p.progress),
                    backgroundColor: '#10b981',
                    barThickness: 10,
                  },
                ],
              }}
              options={{
                indexAxis: 'y',
                responsive: true,
                plugins: {
                  legend: { display: true },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        if (context.dataset.label === 'Progress') {
                          return `Progress: ${context.parsed.x}%`
                        }
                        return `${context.dataset.label}: ${new Date(context.parsed.x[0]).toLocaleDateString()} - ${new Date(context.parsed.x[1]).toLocaleDateString()}`
                      },
                    },
                  },
                },
                scales: {
                  x: {
                    type: 'time',
                    time: { unit: 'month' },
                    stacked: true,
                  },
                  y: { stacked: true },
                },
              }}
            />
          )}
        </CCardBody>
      </CCard>

      {/* Recent Projects Table */}
      <CCard className="shadow-sm">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Recent Projects</h5>
          <Link to="/projects">
            <CButton color="primary" size="sm">
              View All
            </CButton>
          </Link>
        </CCardHeader>
        <CCardBody>
          {recentProjects.length === 0 ? (
            <p className="text-center text-muted py-4">No projects yet</p>
          ) : (
            <CTable hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Project</CTableHeaderCell>
                  <CTableHeaderCell>Location</CTableHeaderCell>
                  <CTableHeaderCell>Timeline</CTableHeaderCell>
                  <CTableHeaderCell>Value</CTableHeaderCell>
                  <CTableHeaderCell>Progress</CTableHeaderCell>
                  <CTableHeaderCell className="text-center">Action</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {recentProjects.map((project) => {
                  const progress = project.boq?.summary?.percentageComplete || 0
                  return (
                    <CTableRow key={project._id}>
                      <CTableDataCell>
                        <strong>{project.name}</strong>
                      </CTableDataCell>
                      <CTableDataCell>{project.location}</CTableDataCell>
                      <CTableDataCell>
                        {new Date(project.timelineStart).toLocaleDateString('en-GB', {
                          month: 'short',
                          year: 'numeric',
                        })}{' '}
                        -
                        {new Date(project.timelineEnd).toLocaleDateString('en-GB', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </CTableDataCell>
                      <CTableDataCell>
                        {formatCurrency(project.boq?.summary?.totalContractSum || 0)}
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="d-flex align-items-center gap-2">
                          <CProgress className="flex-grow-1" height={12}>
                            <CProgressBar
                              color={getProgressColor(progress)}
                              value={progress}
                              animated
                              striped
                            />
                          </CProgress>
                          <small className="fw-bold">{progress.toFixed(1)}%</small>
                        </div>
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        <Link to={`/projects/view/${project._id}/boq`}>
                          <CButton color="primary" size="sm">
                            View BOQ
                          </CButton>
                        </Link>
                      </CTableDataCell>
                    </CTableRow>
                  )
                })}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>
    </>
  )
}

export default Dashboard
