import { getDayTypeDisplay, getWorkingHoursDisplay } from "../../assets/assets";
import { formatNepalDate, formatNepalTime } from "../../utils/format";

const statusTone = (status) =>
  status === "PRESENT" ? "success" : status === "LATE" ? "warning" : "danger";

const AttendanceHistory = ({ history }) => {
  return (
    <div className="card overflow-hidden">
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Working Hours</th>
              <th>Day Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((record) => {
              const dayType = getDayTypeDisplay(record);
              const tone = statusTone(record.status);
              return (
                <tr key={record._id || record.id}>
                  <td className="font-medium text-ink-900">
                    {formatNepalDate(record.date)}
                  </td>
                  <td className="text-ink-600">
                    {record.checkIn ? formatNepalTime(record.checkIn) : "—"}
                  </td>
                  <td className="text-ink-600">
                    {record.checkOut ? formatNepalTime(record.checkOut) : "—"}
                  </td>
                  <td className="text-ink-600">{getWorkingHoursDisplay(record)}</td>
                  <td>
                    {dayType.label !== "-" ? (
                      <span className={`badge ${dayType.className}`}>{dayType.label}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        tone === "success"
                          ? "badge-success"
                          : tone === "warning"
                          ? "badge-warning"
                          : "badge-danger"
                      }`}
                    >
                      {record.status === "LATE" ? "Late" : record.status === "PRESENT" ? "Present" : record.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceHistory;
