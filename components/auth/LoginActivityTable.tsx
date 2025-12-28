"use client";

import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import { format } from "date-fns";

type LoginActivity = {
  id: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  browser: string | null;
  operatingSystem: string | null;
  deviceType: string | null;
  location: string | null;
  status: string;
  failReason: string | null;
  loginTime: Date;
};

type LoginActivityTableProps = {
  activities: LoginActivity[];
};

export default function LoginActivityTable({
  activities,
}: LoginActivityTableProps) {
  // Functie om device type icon te bepalen
  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case "mobile":
        return <Smartphone className='h-4 w-4' />;
      case "tablet":
        return <Tablet className='h-4 w-4' />;
      case "desktop":
      default:
        return <Monitor className='h-4 w-4' />;
    }
  };

  // Functie om status badge te bepalen
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
            <CheckCircle className='h-3 w-3 mr-1' />
            Succesvol
          </span>
        );
      case "FAILED":
        return (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'>
            <XCircle className='h-3 w-3 mr-1' />
            Mislukt
          </span>
        );
      case "SUSPICIOUS":
        return (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
            <AlertTriangle className='h-3 w-3 mr-1' />
            Verdacht
          </span>
        );
      default:
        return (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
            Onbekend
          </span>
        );
    }
  };

  if (activities.length === 0) {
    return (
      <div className='text-center py-8'>
        <p className='text-gray-500'>Geen inlogactiviteiten gevonden.</p>
      </div>
    );
  }

  return (
    <div className='overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg'>
      <table className='min-w-full divide-y divide-gray-300'>
        <thead className='bg-gray-50'>
          <tr>
            <th
              scope='col'
              className='py-3.5 pl-4 pr-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
            >
              Datum & tijd
            </th>
            <th
              scope='col'
              className='px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
            >
              Apparaat
            </th>
            <th
              scope='col'
              className='px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
            >
              Locatie
            </th>
            <th
              scope='col'
              className='px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody className='divide-y divide-gray-200 bg-white'>
          {activities.map((activity) => (
            <tr
              key={activity.id}
              className={activity.status === "SUSPICIOUS" ? "bg-red-50" : ""}
            >
              <td className='py-4 pl-4 pr-3 text-sm'>
                <div className='font-medium text-gray-900'>
                  {format(activity.loginTime, "dd-MM-yyyy HH:mm")}
                </div>
                <div className='text-gray-500'>{activity.ipAddress}</div>
              </td>
              <td className='px-3 py-4 text-sm'>
                <div className='flex items-center'>
                  {getDeviceIcon(activity.deviceType)}
                  <div className='ml-2'>
                    <div className='font-medium text-gray-900'>
                      {activity.browser || "Onbekend"}
                    </div>
                    <div className='text-gray-500'>
                      {activity.operatingSystem || "Onbekend"}
                    </div>
                  </div>
                </div>
              </td>
              <td className='px-3 py-4 text-sm'>
                <div className='flex items-center'>
                  <Globe className='h-4 w-4 text-gray-400 mr-1' />
                  <span>{activity.location || "Onbekend"}</span>
                </div>
              </td>
              <td className='px-3 py-4 text-sm'>
                <div>{getStatusBadge(activity.status)}</div>
                {activity.failReason && (
                  <div className='text-xs text-gray-500 mt-1'>
                    {activity.failReason}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
