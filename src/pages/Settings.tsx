import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Settings = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">الإعدادات</h1>
        <p className="text-muted-foreground">إدارة إعدادات النظام</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="medical-card">
          <CardHeader>
            <CardTitle>معلومات العيادة</CardTitle>
            <CardDescription>تحديث بيانات العيادة الأساسية</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">قريباً...</p>
          </CardContent>
        </Card>

        <Card className="medical-card">
          <CardHeader>
            <CardTitle>الإشعارات</CardTitle>
            <CardDescription>إدارة إعدادات الإشعارات</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">قريباً...</p>
          </CardContent>
        </Card>

        <Card className="medical-card">
          <CardHeader>
            <CardTitle>النسخ الاحتياطي</CardTitle>
            <CardDescription>إدارة النسخ الاحتياطية للبيانات</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">قريباً...</p>
          </CardContent>
        </Card>

        <Card className="medical-card">
          <CardHeader>
            <CardTitle>الأمان</CardTitle>
            <CardDescription>إعدادات الأمان والخصوصية</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">قريباً...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
