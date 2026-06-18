import React from 'react';
import { useNavigate } from 'react-router-dom';

function LinksTable({
  routes = [],
}) {
  const navigate =
    useNavigate();

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div
          style={
            styles.header
          }
        >
          <div>
            <h1
              style={
                styles.title
              }
            >
              Navigation
              Dashboard
            </h1>

            <p
              style={
                styles.subtitle
              }
            >
              Manage and
              access all
              routes from
              one place
            </p>
          </div>

          <div
            style={
              styles.badge
            }
          >
            {
              routes.length
            }{' '}
            Routes
          </div>
        </div>

        <div
          style={
            styles.tableWrapper
          }
        >
          <table
            style={
              styles.table
            }
          >
            <thead>
              <tr>
                <th
                  style={
                    styles.th
                  }
                >
                  #
                </th>

                <th
                  style={
                    styles.th
                  }
                >
                  Name
                </th>

                <th
                  style={
                    styles.th
                  }
                >
                  Route Path
                </th>

                <th
                  style={
                    styles.th
                  }
                >
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {routes.map(
                (
                  item,
                  index,
                ) => (
                  <tr
                    key={
                      item.path
                    }
                    style={
                      styles.row
                    }
                  >
                    <td
                      style={
                        styles.td
                      }
                    >
                      <div
                        style={
                          styles.index
                        }
                      >
                        {index +
                          1}
                      </div>
                    </td>

                    <td
                      style={
                        styles.td
                      }
                    >
                      <div
                        style={
                          styles.name
                        }
                      >
                        {
                          item.name
                        }
                      </div>
                    </td>

                    <td
                      style={
                        styles.td
                      }
                    >
                      <code
                        style={
                          styles.path
                        }
                      >
                        {
                          item.path
                        }
                      </code>
                    </td>

                    <td
                      style={
                        styles.td
                      }
                    >
                      <button
                        style={
                          styles.button
                        }
                        onClick={() => navigate(item.path.replace('/*',''),)
                        }
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background:
      '#f4f7fb',
    padding: 40,
    fontFamily:
      'Inter, sans-serif',
  },

  card: {
    background:
      '#ffffff',
    borderRadius: 24,
    padding: 30,
    boxShadow:
      '0 10px 40px rgba(0,0,0,0.08)',
    maxWidth: 1200,
    margin: '0 auto',
  },

  header: {
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'center',
    marginBottom: 30,
    flexWrap: 'wrap',
    gap: 15,
  },

  title: {
    margin: 0,
    fontSize: 32,
    fontWeight: 700,
    color: '#1e293b',
  },

  subtitle: {
    marginTop: 8,
    color: '#64748b',
    fontSize: 15,
  },

  badge: {
    background:
      '#2563eb',
    color: '#fff',
    padding:
      '10px 18px',
    borderRadius: 999,
    fontWeight: 600,
    fontSize: 14,
  },

  tableWrapper: {
    overflowX: 'auto',
    borderRadius: 20,
    border:
      '1px solid #e2e8f0',
  },

  table: {
    width: '100%',
    borderCollapse:
      'collapse',
    minWidth: 700,
  },

  th: {
    background:
      '#f8fafc',
    padding: 18,
    textAlign:
      'left',
    fontSize: 14,
    fontWeight: 700,
    color: '#475569',
    borderBottom:
      '1px solid #e2e8f0',
  },

  td: {
    padding: 18,
    borderBottom:
      '1px solid #f1f5f9',
  },

  row: {
    transition:
      'all 0.2s ease',
  },

  index: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background:
      '#eff6ff',
    display: 'flex',
    alignItems:
      'center',
    justifyContent:
      'center',
    fontWeight: 600,
    color: '#2563eb',
  },

  name: {
    fontWeight: 600,
    color: '#0f172a',
    fontSize: 15,
  },

  path: {
    background:
      '#f1f5f9',
    padding:
      '8px 12px',
    borderRadius: 10,
    color: '#334155',
    fontSize: 14,
  },

  button: {
    border: 'none',
    background:
      '#2563eb',
    color: '#fff',
    padding:
      '10px 18px',
    borderRadius: 12,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    transition:
      '0.2s ease',
    boxShadow:
      '0 4px 12px rgba(37,99,235,0.25)',
  },
};

export default LinksTable;